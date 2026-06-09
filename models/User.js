// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  // فیلدهای امنیتی جدید
  isActive: {
    type: Boolean,
    default: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedUntil: {
    type: Date,
    default: null
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  failedRecoveryAttempts: {
    type: Number,
    default: 0
  },
  recoveryLockUntil: {
    type: Date,
    default: null
  },
  lastLoginAt: {
    type: Date
  },
  lastLoginIp: {
    type: String
  },
  lastLoginDevice: {
    type: String
  }
}, {
  timestamps: true
});

// ایندکس‌های امنیتی
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ phone: 1, isActive: 1 });

export default mongoose.models.User || mongoose.model("User", UserSchema);