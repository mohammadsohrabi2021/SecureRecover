import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true
  },
  deviceName: {
    type: String,
    default: "Unknown Device"
  },
  deviceType: {
    type: String,
    enum: ["mobile", "tablet", "desktop", "bot", "unknown"],
    default: "unknown"
  },
  browser: {
    type: String,
    default: "Unknown"
  },
  os: {
    type: String,
    default: "Unknown"
  },
  userAgent: {
    type: String
  },
  ip: {
    type: String
  },
  location: {
    city: String,
    country: String
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isValid: {
    type: Boolean,
    default: true
  },
  isTrusted: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});

// Indexes
SessionSchema.index({ userId: 1, isValid: 1 });
SessionSchema.index({ sessionId: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Session || mongoose.model("Session", SessionSchema);