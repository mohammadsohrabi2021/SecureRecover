import mongoose from "mongoose";

const TrustEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  deviceId: { type: String, required: true },
  ipAddress: String,
  location: {
    lat: Number,
    lng: Number,
    city: String,
    country: String
  },
  timeOfDay: Number,
  dayOfWeek: Number,
  isSuccessful: Boolean,
  score: Number,
  usedOTP: Boolean,
  usedBackupCode: Boolean,
  createdAt: { type: Date, default: Date.now }
});

const TrustedDeviceScoreSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  deviceName: String,
  deviceType: String,
  browser: String,
  os: String,
  lastSeen: Date,
  trustMultiplier: { type: Number, default: 1.0, min: 0.5, max: 1.5 },
  loginCount: { type: Number, default: 0 },
  successRate: { type: Number, default: 100 },
});

const UnusualPatternSchema = new mongoose.Schema({
  pattern: {
    type: String,
    enum: ["NEW_LOCATION", "UNUSUAL_TIME", "NEW_DEVICE", "SUSPICIOUS_IP", "RAPID_LOGINS"]
  },
  detectedAt: { type: Date, default: Date.now },
  severity: { type: Number, min: 1, max: 10 },
  resolved: { type: Boolean, default: false }
});

const TrustHistorySchema = new mongoose.Schema({
  score: Number,
  reason: String,
  changedAt: { type: Date, default: Date.now }
});

const TrustScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: "User"
  },
  currentScore: {
    type: Number,
    default: 50,
    min: -50,
    max: 100
  },
  baseScore: {
    type: Number,
    default: 50
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: Date,
  lastLoginLocation: String,
  trustedDevices: [TrustedDeviceScoreSchema],
  unusualPatterns: [UnusualPatternSchema],
  trustHistory: [TrustHistorySchema]
}, {
  timestamps: true
});

// Indexes — deviceId uniqueness is per-user (enforced in service layer), not global
TrustScoreSchema.index({ userId: 1 });
TrustScoreSchema.index({ currentScore: -1 });

export default mongoose.models.TrustScore ||
  mongoose.model("TrustScore", TrustScoreSchema);