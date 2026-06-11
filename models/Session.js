// models/Session.js
import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  tokenHash: {
    type: String,
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  deviceName: String,
  deviceType: String,
  browser: String,
  os: String,
  ip: String,
  userAgent: String,
  lastActive: {
    type: Date,
    default: Date.now
  },
  isValid: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1, isValid: 1 });

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);