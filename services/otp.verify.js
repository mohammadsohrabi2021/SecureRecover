import connectDB from "@/lib/db";
import Otp from "@/models/Otp";
import User from "@/models/User";
import SecurityLog from "@/models/SecurityLog";
import { compareValue } from "@/lib/hash";

export async function verifyOtp(identifier, type, inputCode, requestMeta = {}) {
  await connectDB();

  const otpRecord = await Otp.findOne({
    identifier: type === "email" ? identifier.toLowerCase() : identifier,
    type,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    throw new Error("کد منقضی شده یا نامعتبر است");
  }

  if (otpRecord.lockedUntil && otpRecord.lockedUntil > new Date()) {
    const remainingSeconds = Math.ceil((otpRecord.lockedUntil - new Date()) / 1000);
    throw new Error(`لطفاً ${remainingSeconds} ثانیه بعد دوباره تلاش کنید`);
  }

  otpRecord.attempts += 1;

  const isMatch = await compareValue(inputCode, otpRecord.codeHash);

  if (!isMatch) {
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      otpRecord.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await SecurityLog.create({
        action: "OTP_MAX_ATTEMPTS",
        status: "failed",
        ip: requestMeta.ip,
        userAgent: requestMeta.userAgent,
        details: { type, identifier: identifier.slice(0, 3) + "****" },
      });
    }
    await otpRecord.save();
    throw new Error(`کد نامعتبر (${otpRecord.maxAttempts - otpRecord.attempts} تلاش باقی مانده)`);
  }

  otpRecord.used = true;
  otpRecord.usedAt = new Date();
  await otpRecord.save();

  const user =
    type === "email"
      ? await User.findOne({ email: identifier.toLowerCase() })
      : await User.findOne({ phone: identifier });

  if (!user) throw new Error("کاربر یافت نشد");

  await SecurityLog.create({
    userId: user._id,
    action: "OTP_VERIFIED",
    status: "success",
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    deviceId: requestMeta.deviceId,
    details: { type },
  });

  return { success: true, userId: user._id };
}
