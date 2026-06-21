// models/TwoFactorAuth.js
import mongoose from "mongoose";

const TwoFactorAuthSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  deviceId: {
    type: String,
    required: true
  },
  steps: {
    emailVerified: {
      type: Boolean,
      default: false
    },
    phoneVerified: {
      type: Boolean,
      default: false
    }
  },
  emailOtpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Otp"
  },
  phoneOtpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Otp"
  },
  status: {
    type: String,
    enum: ["pending", "partial", "completed", "expired"],
    default: "pending"
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 دقیقه
  },
  ip: String,
  userAgent: String,
  location: Object
}, {
  timestamps: true
});

TwoFactorAuthSchema.index({ sessionId: 1 });
TwoFactorAuthSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.TwoFactorAuth ||
  mongoose.model("TwoFactorAuth", TwoFactorAuthSchema);