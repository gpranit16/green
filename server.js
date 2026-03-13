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

app.use(cors());
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

// API Endpoints

// 1. Create a new emergency request
app.post('/api/request', async (req, res) => {
  try {
    // Clear out any existing active requests (for the sake of the hackathon demo, we only keep 1 active at a time usually, but let's just make a new one)
    const newRequest = new EmergencyRequest({
      ...req.body,
      status: 'WAITING_HOSPITAL'
    });
    await newRequest.save();
    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Get the most recent active emergency request
app.get('/api/request/active', async (req, res) => {
  try {
    const activeRequest = await EmergencyRequest.findOne({
      status: { $in: ['WAITING_HOSPITAL', 'WAITING_POLICE', 'ASSIGNED', 'TRACKING'] }
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: activeRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Update the status of a request
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
    res.json({ success: true, data: updatedRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 GreenCorridor Backend running on http://localhost:${PORT}`);
});
