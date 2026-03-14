import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5050;
const MAX_PORT_ATTEMPTS = 10;

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors(
  allowedOrigins.length === 0
    ? undefined
    : {
        origin: (origin, callback) => {
          // allow server-to-server and same-origin requests without an origin header
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(new Error('Not allowed by CORS'));
        }
      }
));
app.use(express.json());

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env file");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Backend Database'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Schema & Model
const emergencyRequestSchema = new mongoose.Schema({
  location: String,
  condition: String,
  contact: String,
  email: String,
  patientName: String,
  hospital: String,
  notificationsSent: {
    hospitalApprovedAt: Date,
    trackingStartedAt: Date,
  },
  status: {
    type: String,
    enum: ['WAITING_HOSPITAL', 'WAITING_POLICE', 'ASSIGNED', 'TRACKING', 'ARRIVED', 'REJECTED', 'CANCELLED'],
    default: 'WAITING_HOSPITAL'
  }
}, { timestamps: true });

const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);
const ACTIVE_STATUSES = ['WAITING_HOSPITAL', 'WAITING_POLICE', 'ASSIGNED', 'TRACKING'];
const TERMINAL_STATUSES = ['ARRIVED', 'REJECTED', 'CANCELLED'];

app.get('/api/health', (_req, res) => {
  res.json({ success: true, service: 'green-corridor-api', uptime: process.uptime() });
});

function normalizeEmail(email) {
  if (!email) return '';
  return String(email).trim().toLowerCase();
}

async function sendSmsIfConfigured(to, message) {
  const provider = (process.env.SMS_PROVIDER || '').toLowerCase();
  if (!to || !provider) return { skipped: true, reason: 'SMS_PROVIDER not set' };

  if (provider !== 'twilio') {
    return { skipped: true, reason: `Unsupported SMS provider: ${provider}` };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_FROM;
  if (!accountSid || !authToken || !fromNumber) {
    return { skipped: true, reason: 'Missing Twilio env keys' };
  }

  const body = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: message,
  });

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio SMS failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return { success: true, sid: data.sid };
}

async function sendResendEmailIfConfigured(to, subject, html, text) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'Green Corridor <onboarding@resend.dev>';
  const recipient = normalizeEmail(to);

  if (!apiKey || !recipient) {
    return { skipped: true, reason: 'Missing RESEND_API_KEY or recipient email' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject,
      html,
      text
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend email failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  console.log(`✅ Resend email accepted: ${data.id}`);
  return { success: true, id: data.id };
}

app.post('/api/email/test', async (req, res) => {
  try {
    const to = normalizeEmail(req.body?.to || req.query?.to);
    if (!to) {
      return res.status(400).json({ success: false, message: 'Missing `to` email.' });
    }

    const link = 'https://green-frontend-weld.vercel.app/#simulation';
    const result = await sendResendEmailIfConfigured(
      to,
      'Green Corridor Email Delivery Test',
      `<p>This is a test email from <strong>Green Corridor</strong>.</p><p>Track link: <a href="${link}">${link}</a></p>`,
      `This is a test email from Green Corridor.\nTrack link: ${link}`
    );

    return res.json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// API Endpoints

// 1. Create a new emergency request
app.post('/api/request', async (req, res) => {
  try {
    // Keep at most one active request for the demo flow.
    await EmergencyRequest.updateMany(
      { status: { $in: ACTIVE_STATUSES } },
      { status: 'CANCELLED', updatedAt: Date.now() }
    );

    const newRequest = new EmergencyRequest({
      ...req.body,
      email: normalizeEmail(req.body.email),
      status: 'WAITING_HOSPITAL'
    });
    await newRequest.save();

    if (newRequest.contact) {
      const smsText = `GreenCorridor: Request received for ${newRequest.hospital || 'selected hospital'}. Waiting for hospital approval.`;
      try {
        await sendSmsIfConfigured(newRequest.contact, smsText);
      } catch (smsError) {
        console.warn('⚠️ SMS send failed:', smsError.message);
      }
    }

    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Get the most recent active emergency request
app.get('/api/request/active', async (req, res) => {
  try {
    // Auto-cancel stale active requests so old records don't appear as "incoming" forever.
    const staleBefore = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes (demo-safe)
    await EmergencyRequest.updateMany(
      {
        status: { $in: ACTIVE_STATUSES },
        updatedAt: { $lt: staleBefore }
      },
      { status: 'CANCELLED', updatedAt: Date.now() }
    );

    const activeRequest = await EmergencyRequest.findOne({
      status: { $in: ACTIVE_STATUSES }
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: activeRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Get request history for dashboards
app.get('/api/request/history', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const history = await EmergencyRequest.find({
      status: { $in: [...ACTIVE_STATUSES, ...TERMINAL_STATUSES] }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Manual clear active request(s)
app.post('/api/request/clear-active', async (req, res) => {
  try {
    const result = await EmergencyRequest.updateMany(
      { status: { $in: ACTIVE_STATUSES } },
      { status: 'CANCELLED', updatedAt: Date.now() }
    );

    res.json({
      success: true,
      message: `Cleared ${result.modifiedCount || 0} active request(s).`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Manual clear history records
app.post('/api/request/clear-history', async (req, res) => {
  try {
    const { scope = 'terminal' } = req.body || {};
    const filter = scope === 'all'
      ? {}
      : { status: { $in: TERMINAL_STATUSES } };

    const result = await EmergencyRequest.deleteMany(filter);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount || 0} request record(s).`,
      scope
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Update the status of a request
app.put('/api/request/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const previousRequest = await EmergencyRequest.findById(req.params.id);
    if (!previousRequest) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const updatedRequest = await EmergencyRequest.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedRequest) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const hasStatusTransition = previousRequest.status !== status;

    const emailMap = {
      WAITING_POLICE: {
        subject: 'Green Corridor: Hospital Approved Your Request',
        text: `Green Corridor System:\nYour emergency request has been approved by the hospital.\nHospital: ${updatedRequest.hospital || 'Selected hospital'}\nAmbulance: AMB-404\nDriver: Rajesh Kumar`,
        html: `<p><strong>Green Corridor System</strong></p><p>Your emergency request has been approved by the hospital.</p><p><strong>Hospital:</strong> ${updatedRequest.hospital || 'Selected hospital'}<br/><strong>Ambulance:</strong> AMB-404<br/><strong>Driver:</strong> Rajesh Kumar</p>`,
        flagPath: 'notificationsSent.hospitalApprovedAt',
        alreadySent: Boolean(previousRequest.notificationsSent?.hospitalApprovedAt),
        label: 'hospital-approved'
      },
      ASSIGNED: {
        subject: 'Green Corridor: Hospital Approved Your Request',
        text: `Green Corridor System:\nYour emergency request has been approved by the hospital.\nHospital: ${updatedRequest.hospital || 'Selected hospital'}\nAmbulance: AMB-404\nDriver: Rajesh Kumar`,
        html: `<p><strong>Green Corridor System</strong></p><p>Your emergency request has been approved by the hospital.</p><p><strong>Hospital:</strong> ${updatedRequest.hospital || 'Selected hospital'}<br/><strong>Ambulance:</strong> AMB-404<br/><strong>Driver:</strong> Rajesh Kumar</p>`,
        flagPath: 'notificationsSent.hospitalApprovedAt',
        alreadySent: Boolean(previousRequest.notificationsSent?.hospitalApprovedAt),
        label: 'hospital-approved-fallback'
      },
      TRACKING: {
        subject: 'Green Corridor: Live Tracking Started',
        text: 'Trip has started. Track your ambulance live:\nhttps://green-frontend-weld.vercel.app/#simulation',
        html: '<p><strong>Green Corridor System</strong></p><p>Trip has started.</p><p>Track your ambulance live:<br/><a href="https://green-frontend-weld.vercel.app/#simulation">https://green-frontend-weld.vercel.app/#simulation</a></p>',
        flagPath: 'notificationsSent.trackingStartedAt',
        alreadySent: Boolean(previousRequest.notificationsSent?.trackingStartedAt),
        label: 'tracking-started'
      }
    };

    const selected = emailMap[status];
    const shouldAttemptEmail = Boolean(
      selected &&
      hasStatusTransition &&
      updatedRequest.email &&
      !selected.alreadySent
    );

    if (selected) {
      console.log(
        `📨 Notification check | request=${updatedRequest._id} | from=${previousRequest.status} -> to=${status} | hasTransition=${hasStatusTransition} | hasEmail=${Boolean(updatedRequest.email)} | alreadySent=${selected.alreadySent}`
      );
    }

    if (shouldAttemptEmail) {
      try {
        await sendResendEmailIfConfigured(updatedRequest.email, selected.subject, selected.html, selected.text);
        const sentAt = new Date();
        await EmergencyRequest.findByIdAndUpdate(req.params.id, {
          $set: {
            [selected.flagPath]: sentAt,
            updatedAt: Date.now(),
          }
        });
        console.log(`✅ Notification sent (${selected.label}) for request=${updatedRequest._id}`);
      } catch (emailError) {
        console.warn(`⚠️ Email notification failed (${selected.label}) for request=${updatedRequest._id}:`, emailError.message);
      }
    } else if (selected) {
      console.log(`ℹ️ Notification skipped (${selected.label}) for request=${updatedRequest._id}`);
    }

    res.json({ success: true, data: updatedRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Server
function startServer(port, attemptsLeft = MAX_PORT_ATTEMPTS) {
  const server = app.listen(port, () => {
    console.log(`🚀 GreenCorridor Backend running on http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
      const nextPort = Number(port) + 1;
      console.warn(`⚠️ Port ${port} is in use. Retrying on ${nextPort}...`);
      startServer(nextPort, attemptsLeft - 1);
      return;
    }

    console.error('❌ Failed to start backend server:', error);
    process.exit(1);
  });
}

startServer(Number(PORT));
