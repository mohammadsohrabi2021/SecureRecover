// services/auth.service.js
import connectDB from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";
import RecoveryCode from "@/models/RecoveryCode";
import SecurityLog from "@/models/SecurityLog";
import TrustedDevice from "@/models/TrustedDevice";
import { signToken } from "@/lib/jwt";
import { generateSessionId } from "@/lib/hash";
import { verifyOtp } from "./otp.service";
import { generateUserRecoveryCodes } from "./recovery.service";
import trustScoreService from "./trustScore.service";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";

export async function registerUser(userData, requestMeta = {}) {
  await connectDB();
  
  const { name, email, phone } = userData;
  
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });
  
  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error("این ایمیل قبلاً ثبت نام کرده است");
    }
    if (existingUser.phone === phone) {
      throw new Error("این شماره تلفن قبلاً ثبت نام کرده است");
    }
  }
  
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    isEmailVerified: false,
    isPhoneVerified: false,
    isActive: true,
    failedLoginAttempts: 0,
    failedRecoveryAttempts: 0
  });
  
  await SecurityLog.create({
    userId: user._id,
    action: "REGISTER",
    status: "success",
    ip: requestMeta.ip || "unknown",
    userAgent: requestMeta.userAgent || "unknown",
    details: { email, phone: phone.slice(0, -4) + "****" }
  });
  
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone
  };
}

export async function loginWithOtp(identifier, inputCode, requestMeta = {}) {
  await connectDB();
  
  console.log("=== LOGIN WITH OTP START ===");
  console.log("identifier:", identifier);
  console.log("inputCode:", inputCode);
  console.log("deviceId from requestMeta:", requestMeta.deviceId);
  
  let type = '';
  if (!type) {
    type = identifier.includes("@") ? "email" : "phone";
  }
  console.log("type:", type);
  
  const verifyResult = await verifyOtp(identifier, type, inputCode, requestMeta);
  console.log("verifyResult:", verifyResult);
  
  if (!verifyResult || !verifyResult.userId) {
    throw new Error("کد تأیید نامعتبر است");
  }
  
  const userId = verifyResult.userId;
  console.log("userId:", userId);
  
  const user = await User.findById(userId);
  console.log("user found:", !!user);
  
  if (!user || !user.isActive) {
    throw new Error("حساب کاربری غیرفعال است");
  }
  
  if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw new Error(`حساب کاربری به مدت ${remainingMinutes} دقیقه قفل شده است`);
  }
  
  const parser = new UAParser(requestMeta.userAgent);
  const deviceInfo = parser.getResult();
  
  const sessionId = generateSessionId();
  
  let deviceId = requestMeta.deviceId;
  if (!deviceId) {
    const fingerprint = requestMeta.userAgent || 'unknown';
    deviceId = crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 32);
    console.log(`🆕 Device ID generated from fingerprint: ${deviceId}`);
  }
  console.log(`🔑 Device ID used: ${deviceId}`);
  
  // ✅ بررسی و مدیریت دستگاه (اصلاح شده)
  let isTrustedDevice = false;
  let existingDevice = await TrustedDevice.findOne({
    userId: user._id,
    deviceId: deviceId,
    isActive: true
  });
  
  // ✅ اگر دستگاه با deviceId پیدا نشد، بر اساس userAgent جستجو کن
  if (!existingDevice && requestMeta.userAgent) {
    existingDevice = await TrustedDevice.findOne({
      userId: user._id,
      userAgent: requestMeta.userAgent,
      isActive: true
    });
    if (existingDevice) {
      // ✅ deviceId تکراری را حذف کن
      await TrustedDevice.deleteMany({
        userId: user._id,
        deviceId: deviceId
      });
      existingDevice.deviceId = deviceId;
      await existingDevice.save();
      console.log(`🔄 Device ID updated for existing device: ${deviceId}`);
    }
  }
  
  if (existingDevice) {
    isTrustedDevice = true;
    existingDevice.lastUsedAt = new Date();
    existingDevice.lastUsedIp = requestMeta.ip;
    existingDevice.loginCount += 1;
    await existingDevice.save();
    console.log(`✅ Trusted device found (${existingDevice.loginCount} logins)`);
  } else {
    // ✅ قبل از ایجاد جدید، بررسی کن که deviceId تکراری نباشد
    const duplicateCheck = await TrustedDevice.findOne({
      userId: user._id,
      deviceId: deviceId
    });
    
    if (duplicateCheck) {
      // اگر deviceId تکراری است، از همان استفاده کن
      duplicateCheck.isActive = true;
      duplicateCheck.lastUsedAt = new Date();
      duplicateCheck.lastUsedIp = requestMeta.ip;
      duplicateCheck.loginCount += 1;
      await duplicateCheck.save();
      isTrustedDevice = true;
      existingDevice = duplicateCheck;
      console.log(`♻️ Using existing device with same deviceId: ${deviceId}`);
    } else {
      // ثبت دستگاه جدید
      existingDevice = await TrustedDevice.create({
        userId: user._id,
        deviceId,
        deviceName: deviceInfo.device.model || `${deviceInfo.browser.name} on ${deviceInfo.os.name}`,
        deviceType: deviceInfo.device.type || "desktop",
        browser: deviceInfo.browser.name,
        os: deviceInfo.os.name,
        userAgent: requestMeta.userAgent,
        lastUsedIp: requestMeta.ip,
        loginCount: 1
      });
      console.log(`🆕 New device registered: ${deviceId}`);
    }
  }
  
  // ✅ ادامه کد (ایجاد session و ...)
  const session = await Session.create({
    userId: user._id,
    sessionId,
    deviceId: deviceId,
    deviceName: deviceInfo.device.model || `${deviceInfo.browser.name} on ${deviceInfo.os.name}`,
    deviceType: deviceInfo.device.type || "desktop",
    browser: deviceInfo.browser.name || "Unknown",
    os: deviceInfo.os.name || "Unknown",
    userAgent: requestMeta.userAgent,
    ip: requestMeta.ip,
    location: requestMeta.location,
    isValid: true,
    isTrusted: isTrustedDevice,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  
  console.log("Session created:", session._id);
  
  const token = signToken(user._id.toString(), sessionId);
  
  user.lastLoginAt = new Date();
  user.lastLoginIp = requestMeta.ip;
  user.lastLoginDevice = requestMeta.userAgent;
  user.lastLoginLocation = requestMeta.location;
  user.failedLoginAttempts = 0;
  user.isLocked = false;
  user.lockedUntil = null;
  await user.save();
  
  await SecurityLog.create({
    userId: user._id,
    action: "LOGIN_SUCCESS",
    status: "success",
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    deviceId,
    details: { sessionId, isTrusted: isTrustedDevice }
  });
  
  let recoveryCodes = null;
  const recoveryCodesCount = await RecoveryCode.countDocuments({ userId: user._id });
  if (recoveryCodesCount === 0) {
    recoveryCodes = await generateUserRecoveryCodes(user._id, requestMeta);
  }
  
  await trustScoreService.updateTrustScore(user._id, {
    isSuccessful: true,
    usedOTP: true,
    deviceId,
    deviceInfo: { 
      deviceName: session.deviceName, 
      deviceType: session.deviceType, 
      browser: session.browser, 
      os: session.os 
    },
    location: requestMeta.location,
    isTrustedDevice: isTrustedDevice,
    userAgent: requestMeta.userAgent
  });
  
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified
    },
    token,
    sessionId,
    deviceId,
    isTrustedDevice,
    recoveryCodes
  };
}

export async function getCurrentUserById(userId) {
  await connectDB();
  
  const user = await User.findById(userId).select("-__v");
  
  if (!user) {
    throw new Error("کاربر یافت نشد");
  }
  
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt
  };
}

export async function logout(sessionId, requestMeta = {}) {
  await connectDB();
  
  const session = await Session.findOne({ sessionId });
  if (session) {
    session.isValid = false;
    await session.save();
    
    await SecurityLog.create({
      userId: session.userId,
      action: "LOGOUT",
      status: "success",
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      deviceId: session.deviceId,
      details: { sessionId }
    });
  }
  
  return true;
}

export async function revokeAllSessions(userId, currentSessionId, requestMeta = {}) {
  await connectDB();
  
  await Session.updateMany(
    { userId, sessionId: { $ne: currentSessionId }, isValid: true },
    { isValid: false }
  );
  
  await SecurityLog.create({
    userId,
    action: "ALL_SESSIONS_REVOKED",
    status: "success",
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    details: { currentSessionId }
  });
  
  return true;
}

export async function validateSession(sessionId, userId) {
  await connectDB();
  
  try {
    const session = await Session.findOne({
      sessionId,
      userId,
      isValid: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!session) {
      console.log(`❌ Session not found or invalid: ${sessionId}`);
      return false;
    }
    
    session.lastActive = new Date();
    await session.save();
    
    console.log(`✅ Session validated: ${sessionId}`);
    return true;
    
  } catch (error) {
    console.error("Validate session error:", error);
    return false;
  }
}