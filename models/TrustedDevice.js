// models/TrustedDevice.js
import mongoose from 'mongoose';

const TrustedDeviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  deviceName: {
    type: String,
    default: 'Unknown Device'
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
    default: 'desktop'
  },
  browser: {
    type: String,
    default: 'Unknown'
  },
  os: {
    type: String,
    default: 'Unknown'
  },
  lastUsedIp: String,
  lastUsedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  trustedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

TrustedDeviceSchema.index({ userId: 1, isActive: 1 });
TrustedDeviceSchema.index({ deviceId: 1 });

export default mongoose.models.TrustedDevice || mongoose.model('TrustedDevice', TrustedDeviceSchema);