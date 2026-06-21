import mongoose from "mongoose";

const SecurityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
  action: {
    type: String,
    enum: [
      "REGISTER",
      "LOGIN_SUCCESS",
      "LOGIN_FAILED",
      "LOGOUT",
      "OTP_SENT",
      "OTP_VERIFIED",
      "OTP_FAILED",
      "OTP_MAX_ATTEMPTS",
      "RECOVERY_CODES_GENERATED",
      "RECOVERY_CODE_USED",
      "RECOVERY_FAILED",
      "SESSION_REVOKED",
      "ALL_SESSIONS_REVOKED",
      "DEVICE_TRUSTED",
      "DEVICE_UNTRUSTED",
      "ACCOUNT_LOCKED",
      "ACCOUNT_UNLOCKED",
      "TRUST_SCORE_UPDATED",
      "CRITICAL_TRUST_LOGIN_ATTEMPT"
    ],
    required: true
  },
  status: {
    type: String,
    enum: ["success", "failed", "pending"],
    required: true
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  deviceId: {
    type: String
  },
  details: {
    type: Object
  }
}, {
  timestamps: true
});

// Indexes
SecurityLogSchema.index({ userId: 1, createdAt: -1 });
SecurityLogSchema.index({ action: 1, status: 1 });
SecurityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.models.SecurityLog ||
  mongoose.model("SecurityLog", SecurityLogSchema);