// models/Otp.js - اصلاح شده
import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['login', 'device', 'recovery'],  // ✅ فقط همین سه مقدار مجاز است
    required: true
  },
  codeHash: {
    type: String,
    required: true
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
    default: () => new Date(Date.now() + 10 * 60 * 1000)
  }
}, {
  timestamps: true
});

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Otp || mongoose.model('Otp', OtpSchema);