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
  patientName: String,
  hospital: String,
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
    const updatedRequest = await EmergencyRequest.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedRequest) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (updatedRequest.contact && ['WAITING_POLICE', 'ASSIGNED', 'TRACKING', 'ARRIVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      const statusText = {
        WAITING_POLICE: 'Hospital approved. Waiting for police escort confirmation.',
        ASSIGNED: 'Police confirmed. Ambulance assigned and preparing dispatch.',
        TRACKING: 'Ambulance is on the way. Green corridor is active.',
        ARRIVED: 'Ambulance has arrived at destination.',
        REJECTED: 'Request was rejected by hospital and closed.',
        CANCELLED: 'Request has been cancelled.',
      };
      try {
        await sendSmsIfConfigured(updatedRequest.contact, `GreenCorridor update: ${statusText[status] || status}`);
      } catch (smsError) {
        console.warn('⚠️ SMS status update failed:', smsError.message);
      }
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
