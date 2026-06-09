import mongoose from "mongoose";

const OtpTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true }, // کد هش شده ذخیره می‌شود
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 }, // جلوگیری از Brute-force
}, { timestamps: true });

// حذف خودکار رکورد بعد از انقضا توسط مونگو
OtpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.OtpToken || mongoose.model("OtpToken", OtpTokenSchema);
