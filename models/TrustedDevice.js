// models/TrustedDevice.js
import mongoose from "mongoose";

const TrustedDeviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
    required: true
  },
  deviceType: {
    type: String,
    enum: ["mobile", "tablet", "desktop", "bot", "unknown"],
    default: "unknown"
  },
  browser: String,
  os: String,
  userAgent: String,
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
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 سال
  }
}, {
  timestamps: true
});

TrustedDeviceSchema.index({ userId: 1, isActive: 1 });
TrustedDeviceSchema.index({ deviceId: 1 });

export default mongoose.models.TrustedDevice ||
  mongoose.model("TrustedDevice", TrustedDeviceSchema);