// services/twoFactor.service.js
import connectDB from "@/lib/db";
import TwoFactorAuth from "@/models/TwoFactorAuth";
import User from "@/models/User";
import TrustedDevice from "@/models/TrustedDevice";
import { generateSecureCode } from "@/lib/hash";
import { sendEmailOtp, sendSmsOtp } from "./mail.service";
import Otp from "@/models/Otp";
import { hashValue, compareValue } from "@/lib/hash";
import { UAParser } from "ua-parser-js";
import SecurityLog from "@/models/SecurityLog";

class TwoFactorService {
  
  // شروع فرآیند تأیید دو مرحله‌ای با مراحل مشخص
  async initiate2FAWithSteps(userId, deviceId, requiredSteps, requestMeta = {}) {
    await connectDB();
    
    const sessionId = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    const twoFactorSession = await TwoFactorAuth.create({
      userId,
      sessionId,
      deviceId,
      steps: {
        emailVerified: false,
        phoneVerified: false
      },
      status: "pending",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      location: requestMeta.location
    });
    
    const user = await User.findById(userId);
    
    console.log("\n╔═══════════════════════════════════════════════════════════════╗");
    console.log("║              🔐 2FA PROCESS STARTED 🔐                         ║");
    console.log("╠═══════════════════════════════════════════════════════════════╣");
    console.log(`║ 👤 User: ${user.email}`);
    console.log(`║ 📧 Send to Email: ${requiredSteps.email ? "YES ✅" : "NO ❌"}`);
    console.log(`║ 📱 Send to Phone: ${requiredSteps.phone ? "YES ✅" : "NO ❌"}`);
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");
    
    if (requiredSteps.email && user.email) {
      await this.sendEmailCode(user.email, sessionId);
    }
    
    if (requiredSteps.phone && user.phone) {
      await this.sendPhoneCode(user.phone, sessionId);
    }
    
    return {
      sessionId,
      requiresEmail: requiredSteps.email,
      requiresPhone: requiredSteps.phone
    };
  }
  
  // ارسال کد به ایمیل
  async sendEmailCode(email, sessionId) {
    const rawCode = generateSecureCode(6, "number");
    const hashedCode = await hashValue(rawCode);
    
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                 📧 2FA EMAIL CODE 📧                             ║");
    console.log("╠════════════════════════════════════════════════════════════════╣");
    console.log(`║ 📧 Email: ${email}`);
    console.log(`║ 🔐 CODE: ${rawCode}`);
    console.log(`║ ⏰ Expires: 5 minutes`);
    console.log("╚════════════════════════════════════════════════════════════════╝\n");
    
    const otp = await Otp.create({
      identifier: email,
      type: "email",
      codeHash: hashedCode,
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });
    
    await TwoFactorAuth.updateOne(
      { sessionId },
      { emailOtpId: otp._id }
    );
    
    if (process.env.NODE_ENV === "development") {
      console.log(`📧 [DEV MODE] کد ${rawCode} به ایمیل ${email} ارسال شد`);
    } else {
      await sendEmailOtp(email, rawCode);
    }
    
    return { success: true, rawCode };
  }
  
  // ارسال کد به تلفن
  async sendPhoneCode(phone, sessionId) {
    const rawCode = generateSecureCode(6, "number");
    const hashedCode = await hashValue(rawCode);
    
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                 📱 2FA PHONE CODE 📱                             ║");
    console.log("╠════════════════════════════════════════════════════════════════╣");
    console.log(`║ 📞 Phone: ${phone}`);
    console.log(`║ 🔐 CODE: ${rawCode}`);
    console.log(`║ ⏰ Expires: 5 minutes`);
    console.log("╚════════════════════════════════════════════════════════════════╝\n");
    
    const otp = await Otp.create({
      identifier: phone,
      type: "phone",
      codeHash: hashedCode,
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });
    
    await TwoFactorAuth.updateOne(
      { sessionId },
      { phoneOtpId: otp._id }
    );
    
    if (process.env.NODE_ENV === "development") {
      console.log(`📱 [DEV MODE] کد ${rawCode} به شماره ${phone} ارسال شد`);
    } else {
      await sendSmsOtp(phone, rawCode);
    }
    
    return { success: true, rawCode };
  }
  
  // تأیید کد ایمیل
  async verifyEmailCode(sessionId, code, requestMeta = {}) {
    await connectDB();
    
    console.log("=== VERIFY EMAIL CODE ===");
    console.log("sessionId:", sessionId);
    console.log("input code:", code);
    
    const twoFactorSession = await TwoFactorAuth.findOne({ sessionId });
    if (!twoFactorSession) {
      throw new Error("جلسه تأیید معتبر نیست");
    }
    
    if (twoFactorSession.status === "completed") {
      throw new Error("تأیید قبلاً کامل شده است");
    }
    
    if (twoFactorSession.expiresAt < new Date()) {
      throw new Error("زمان جلسه تأیید به پایان رسیده است");
    }
    
    const otp = await Otp.findById(twoFactorSession.emailOtpId);
    if (!otp || otp.used) {
      throw new Error("کد معتبر نیست");
    }
    
    const isValid = await compareValue(code, otp.codeHash);
    if (!isValid) {
      throw new Error("کد اشتباه است");
    }
    
    otp.used = true;
    await otp.save();
    
    twoFactorSession.steps.emailVerified = true;
    
    const requiresPhone = twoFactorSession.phoneOtpId !== null && twoFactorSession.phoneOtpId !== undefined;
    
    if (!requiresPhone || twoFactorSession.steps.phoneVerified) {
      twoFactorSession.status = "completed";
      console.log("✅ Single step (email only) completed!");
    } else {
      twoFactorSession.status = "partial";
      console.log("⏳ Email verified, waiting for phone...");
    }
    
    await twoFactorSession.save();
    
    let nextStep = null;
    if (twoFactorSession.status === "partial" && requiresPhone && !twoFactorSession.steps.phoneVerified) {
      nextStep = "phone";
    }
    
    console.log("✅ Email verification result:", { completed: twoFactorSession.status === "completed", nextStep });
    
    return {
      success: true,
      completed: twoFactorSession.status === "completed",
      nextStep: nextStep
    };
  }
  
  // تأیید کد تلفن
  async verifyPhoneCode(sessionId, code, requestMeta = {}) {
    await connectDB();
    
    console.log("=== VERIFY PHONE CODE ===");
    console.log("sessionId:", sessionId);
    console.log("input code:", code);
    
    const twoFactorSession = await TwoFactorAuth.findOne({ sessionId });
    if (!twoFactorSession) {
      throw new Error("جلسه تأیید معتبر نیست");
    }
    
    if (twoFactorSession.status === "completed") {
      throw new Error("تأیید قبلاً کامل شده است");
    }
    
    if (twoFactorSession.expiresAt < new Date()) {
      throw new Error("زمان جلسه تأیید به پایان رسیده است");
    }
    
    const otp = await Otp.findById(twoFactorSession.phoneOtpId);
    if (!otp || otp.used) {
      throw new Error("کد معتبر نیست");
    }
    
    const isValid = await compareValue(code, otp.codeHash);
    if (!isValid) {
      throw new Error("کد اشتباه است");
    }
    
    otp.used = true;
    await otp.save();
    
    twoFactorSession.steps.phoneVerified = true;
    
    const requiresEmail = twoFactorSession.emailOtpId !== null && twoFactorSession.emailOtpId !== undefined;
    
    if (!requiresEmail || twoFactorSession.steps.emailVerified) {
      twoFactorSession.status = "completed";
      console.log("✅ Single step (phone only) completed!");
    } else {
      twoFactorSession.status = "partial";
      console.log("⏳ Phone verified, waiting for email...");
    }
    
    await twoFactorSession.save();
    
    let nextStep = null;
    if (twoFactorSession.status === "partial" && requiresEmail && !twoFactorSession.steps.emailVerified) {
      nextStep = "email";
    }
    
    if (twoFactorSession.status === "completed") {
      await this.markDeviceAsTrusted(twoFactorSession.userId, twoFactorSession.deviceId, requestMeta);
    }
    
    console.log("✅ Phone verification result:", { completed: twoFactorSession.status === "completed", nextStep });
    
    return {
      success: true,
      completed: twoFactorSession.status === "completed",
      nextStep: nextStep
    };
  }
  
  // دریافت جلسه 2FA
  async get2FASession(sessionId) {
    await connectDB();
    return await TwoFactorAuth.findOne({ sessionId });
  }
  
  // ثبت دستگاه به عنوان قابل اعتماد
  async markDeviceAsTrusted(userId, deviceId, requestMeta = {}) {
    await connectDB();
    
    let trustedDevice = await TrustedDevice.findOne({ userId, deviceId });
    
    if (trustedDevice) {
      trustedDevice.lastUsedAt = new Date();
      trustedDevice.lastUsedIp = requestMeta.ip;
      trustedDevice.loginCount += 1;
      await trustedDevice.save();
      console.log("✅ Device marked as trusted (existing):", deviceId);
    } else {
      const parser = new UAParser(requestMeta.userAgent || "");
      const deviceInfo = parser.getResult();
      
      await TrustedDevice.create({
        userId,
        deviceId,
        deviceName: deviceInfo.device.model || `${deviceInfo.browser.name || "Unknown"} on ${deviceInfo.os.name || "Unknown"}`,
        deviceType: deviceInfo.device.type || "desktop",
        browser: deviceInfo.browser.name || "Unknown",
        os: deviceInfo.os.name || "Unknown",
        userAgent: requestMeta.userAgent,
        lastUsedIp: requestMeta.ip,
        loginCount: 1
      });
      console.log("✅ New device marked as trusted:", deviceId);
    }
    
    return true;
  }
  
  // بررسی وضعیت جلسه 2FA
  async get2FAStatus(sessionId) {
    const twoFactorSession = await TwoFactorAuth.findOne({ sessionId });
    if (!twoFactorSession) return null;
    
    return {
      sessionId: twoFactorSession.sessionId,
      emailVerified: twoFactorSession.steps.emailVerified,
      phoneVerified: twoFactorSession.steps.phoneVerified,
      isCompleted: twoFactorSession.status === "completed",
      expiresAt: twoFactorSession.expiresAt
    };
  }
  
  // دریافت پیام مرحله
  getStepMessage(requiredSteps) {
    if (requiredSteps.email && requiredSteps.phone) {
      return "🔐 برای امنیت بیشتر، لطفاً کد تأیید ارسال شده به ایمیل و شماره تلفن خود را وارد کنید";
    } else if (requiredSteps.email) {
      return "📧 کد تأیید به ایمیل شما ارسال شد";
    } else if (requiredSteps.phone) {
      return "📱 کد تأیید به شماره تلفن شما ارسال شد";
    }
    return "✅ تأیید هویت کامل شد";
  }
}


export async function verifyOtp(identifier, type, inputCode, requestMeta = {}) {
  await connectDB();
  
  console.log("=== VERIFY OTP DEBUG ===");
  console.log("identifier:", identifier);
  console.log("type:", type);
  console.log("inputCode:", inputCode);
  
  const otpRecord = await Otp.findOne({
    identifier: identifier,
    type: type,
    used: false,
    expiresAt: { $gt: new Date() }
  });
  
  if (!otpRecord) {
    console.log("❌ OTP record not found or expired");
    throw new Error("کد منقضی شده یا نامعتبر است");
  }
  
  console.log("✅ OTP record found, checking code...");
  
  if (otpRecord.lockedUntil && otpRecord.lockedUntil > new Date()) {
    const remainingSeconds = Math.ceil((otpRecord.lockedUntil - new Date()) / 1000);
    throw new Error(`لطفاً ${remainingSeconds} ثانیه بعد دوباره تلاش کنید`);
  }
  
  otpRecord.attempts += 1;
  
  const isMatch = await compareValue(inputCode, otpRecord.codeHash);
  console.log("Code match result:", isMatch);
  
  if (!isMatch) {
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      otpRecord.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      
      await SecurityLog.create({
        action: "OTP_MAX_ATTEMPTS",
        status: "failed",
        ip: requestMeta.ip,
        userAgent: requestMeta.userAgent,
        details: { type, identifier: identifier.slice(0, -4) + "****" }
      });
    }
    
    await otpRecord.save();
    throw new Error(`کد نامعتبر است (${otpRecord.maxAttempts - otpRecord.attempts} تلاش باقی مانده)`);
  }
  
  otpRecord.used = true;
  otpRecord.usedAt = new Date();
  await otpRecord.save();
  
  let user = null;
  if (type === "email") {
    user = await User.findOne({ email: identifier });
  } else if (type === "phone") {
    user = await User.findOne({ phone: identifier });
  }
  
  if (!user) {
    throw new Error("کاربر یافت نشد");
  }
  
  await SecurityLog.create({
    userId: user._id,
    action: "OTP_VERIFIED",
    status: "success",
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    deviceId: requestMeta.deviceId,
    details: { type }
  });
  
  console.log("✅ OTP verified successfully for user:", user._id);
  
  return { success: true, userId: user._id };
}
export default new TwoFactorService();