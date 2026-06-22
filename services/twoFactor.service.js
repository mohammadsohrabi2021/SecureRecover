import connectDB from "@/lib/db";
import TwoFactorAuth from "@/models/TwoFactorAuth";
import User from "@/models/User";
import TrustedDevice from "@/models/TrustedDevice";
import Otp from "@/models/Otp";
import SecurityLog from "@/models/SecurityLog";
import { generateSecureCode } from "@/lib/hash";
import { hashValue, compareValue } from "@/lib/hash";
import { sendEmailOtp, sendSmsOtp } from "./mail.service";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";

class TwoFactorService {
  async initiate2FA(userId, deviceId, options = {}, requestMeta = {}) {
    await connectDB();

    const { sendToEmail = true, sendToPhone = false, requiresRecoveryCode = false, canRequestAdminApproval = false, trustLevel = "MEDIUM" } = options;
    const allowsAdminApproval = canRequestAdminApproval || trustLevel === "LOW";

    const sessionId = crypto.randomBytes(24).toString("hex");

    await TwoFactorAuth.create({
      userId,
      sessionId,
      deviceId,
      steps: { emailVerified: false, phoneVerified: false, recoveryVerified: false },
      requiresRecoveryCode,
      canRequestAdminApproval: allowsAdminApproval,
      trustLevel,
      status: "pending",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      location: requestMeta.location,
    });

    const user = await User.findById(userId);

    if (sendToEmail && user?.email) {
      await this.sendEmailCode(user.email, sessionId);
    }

    if (sendToPhone && user?.phone) {
      await this.sendPhoneCode(user.phone, sessionId);
    }

    return {
      sessionId,
      requiresEmail: sendToEmail,
      requiresPhone: sendToPhone,
      requiresRecoveryCode,
      canRequestAdminApproval,
      allowsAdminApproval,
    };
  }

  async sendEmailCode(email, sessionId) {
    const rawCode = generateSecureCode(6, "number");
    const hashedCode = await hashValue(rawCode);

    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] OTP email ${email}: ${rawCode}`);
    }

    const otp = await Otp.create({
      identifier: email.toLowerCase(),
      type: "email",
      codeHash: hashedCode,
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await TwoFactorAuth.updateOne({ sessionId }, { emailOtpId: otp._id });

    if (process.env.NODE_ENV !== "development") {
      await sendEmailOtp(email, rawCode);
    }

    return { success: true };
  }

  async sendPhoneCode(phone, sessionId) {
    const rawCode = generateSecureCode(6, "number");
    const hashedCode = await hashValue(rawCode);

    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] OTP phone ${phone}: ${rawCode}`);
    }

    const otp = await Otp.create({
      identifier: phone,
      type: "phone",
      codeHash: hashedCode,
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await TwoFactorAuth.updateOne({ sessionId }, { phoneOtpId: otp._id });

    if (process.env.NODE_ENV !== "development") {
      await sendSmsOtp(phone, rawCode);
    }

    return { success: true };
  }

  async verifyOtpForSession(sessionId, code, type, requestMeta = {}) {
    await connectDB();

    const session = await TwoFactorAuth.findOne({ sessionId });
    if (!session) throw new Error("جلسه تأیید معتبر نیست");
    if (session.expiresAt < new Date()) throw new Error("زمان جلسه تأیید به پایان رسیده است");

    const otpId = type === "email" ? session.emailOtpId : session.phoneOtpId;
    if (!otpId) throw new Error("کد تأیید برای این مرحله ارسال نشده است");

    const otp = await Otp.findById(otpId);
    if (!otp || otp.used) throw new Error("کد منقضی شده یا نامعتبر است");

    if (otp.lockedUntil && otp.lockedUntil > new Date()) {
      const secs = Math.ceil((otp.lockedUntil - new Date()) / 1000);
      throw new Error(`لطفاً ${secs} ثانیه بعد تلاش کنید`);
    }

    otp.attempts += 1;
    const isValid = await compareValue(code, otp.codeHash);

    if (!isValid) {
      if (otp.attempts >= otp.maxAttempts) {
        otp.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await SecurityLog.create({
          userId: session.userId,
          action: "OTP_MAX_ATTEMPTS",
          status: "failed",
          ip: requestMeta.ip,
          userAgent: requestMeta.userAgent,
          details: { sessionId, type },
        });
      }
      await otp.save();
      throw new Error(`کد نامعتبر (${otp.maxAttempts - otp.attempts} تلاش باقی‌مانده)`);
    }

    otp.used = true;
    otp.usedAt = new Date();
    await otp.save();

    if (type === "email") session.steps.emailVerified = true;
    if (type === "phone") session.steps.phoneVerified = true;

    const needsBoth =
      session.emailOtpId &&
      session.phoneOtpId &&
      !(session.steps.emailVerified && session.steps.phoneVerified);

    if (needsBoth) {
      session.status = "partial";
    } else if (session.requiresRecoveryCode) {
      session.status = "partial";
    } else if (session.canRequestAdminApproval) {
      session.status = "partial";
    } else {
      session.status = "completed";
      await this.markDeviceAsTrusted(session.userId, session.deviceId, requestMeta);
    }

    await session.save();

    await SecurityLog.create({
      userId: session.userId,
      action: "OTP_VERIFIED",
      status: "success",
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      deviceId: session.deviceId,
      details: { type, sessionId },
    });

    let nextStep = null;
    if (session.status === "partial") {
      if (session.emailOtpId && !session.steps.emailVerified) nextStep = "email";
      else if (session.phoneOtpId && !session.steps.phoneVerified) nextStep = "phone";
      else if (session.requiresRecoveryCode && !session.steps.recoveryVerified) nextStep = "recovery";
      else if (session.canRequestAdminApproval) nextStep = "admin-approval";
    }

    return {
      success: true,
      completed: session.status === "completed",
      requiresRecoveryCode: session.requiresRecoveryCode && !session.steps.recoveryVerified,
      canRequestAdminApproval: session.canRequestAdminApproval && session.status === "partial" && nextStep === "admin-approval",
      nextStep,
      userId: session.userId,
      deviceId: session.deviceId,
      trustLevel: session.trustLevel,
    };
  }

  async markRecoveryVerified(sessionId) {
    await connectDB();
    const session = await TwoFactorAuth.findOne({ sessionId });
    if (!session) throw new Error("جلسه معتبر نیست");

    session.steps.recoveryVerified = true;
    session.status = "completed";
    await session.save();
    return session;
  }

  async get2FASession(sessionId) {
    await connectDB();
    return TwoFactorAuth.findOne({ sessionId });
  }

  async markDeviceAsTrusted(userId, deviceId, requestMeta = {}) {
    await connectDB();

    let device = await TrustedDevice.findOne({ userId, deviceId });

    if (device) {
      device.lastUsedAt = new Date();
      device.lastUsedIp = requestMeta.ip;
      device.loginCount += 1;
      device.isActive = true;
      await device.save();
    } else {
      const parser = new UAParser(requestMeta.userAgent || "");
      const info = parser.getResult();

      await TrustedDevice.create({
        userId,
        deviceId,
        deviceName: info.device.model || `${info.browser.name || "Browser"} on ${info.os.name || "OS"}`,
        deviceType: info.device.type || "desktop",
        browser: info.browser.name || "Unknown",
        os: info.os.name || "Unknown",
        userAgent: requestMeta.userAgent,
        lastUsedIp: requestMeta.ip,
        loginCount: 1,
      });
    }
  }
}

export default new TwoFactorService();
