// models/Otp.js
import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ["email", "phone", "recovery"],
    required: true
  },
  codeHash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  lockedUntil: {
    type: Date,
    default: null
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 دقیقه
  }
}, {
  timestamps: true
});

// ایندکس خودکار حذف
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpSchema.index({ identifier: 1, type: 1, used: 1 });

export default mongoose.models.Otp || mongoose.model("Otp", OtpSchema);