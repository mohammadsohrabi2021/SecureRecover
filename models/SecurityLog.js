// models/SecurityLog.js - نسخه کامل با Enum صحیح
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
      "REGISTER",           // ✅ اضافه شد
      "LOGIN_SUCCESS",
      "LOGIN_FAILED",
      "LOGOUT",
      "OTP_SENT",
      "OTP_VERIFIED",
      "OTP_FAILED",
      "RECOVERY_REQUESTED",
      "RECOVERY_CODES_GENERATED",  // ✅ اضافه شد
      "RECOVERY_CODES_RESET",      // ✅ اضافه شد
      "RECOVERY_CODE_USED",
      "RECOVERY_FAILED",
      "SESSION_REVOKED",
      "ALL_SESSIONS_REVOKED",
      "DEVICE_TRUSTED",
      "DEVICE_UNTRUSTED",
      "ACCOUNT_LOCKED",
      "ACCOUNT_UNLOCKED",
      "EMAIL_CHANGE_REQUEST",
      "EMAIL_CHANGED"
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
  deviceInfo: {
    type: Object
  },
  details: {
    type: Object
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// ایندکس‌ها
SecurityLogSchema.index({ userId: 1, createdAt: -1 });
SecurityLogSchema.index({ action: 1, status: 1 });
SecurityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 روز

export default mongoose.models.SecurityLog ||
  mongoose.model("SecurityLog", SecurityLogSchema);