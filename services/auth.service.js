// services/auth.service.js - نسخه کامل
import connectDB from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";
import RecoveryCode from "@/models/RecoveryCode";
import SecurityLog from "@/models/SecurityLog";
import TrustedDevice from "@/models/TrustedDevice";
import { signToken } from "@/lib/jwt";
import { generateSessionId, generateDeviceId } from "@/lib/hash";
import { verifyOtp } from "./otp.service";
import { generateUserRecoveryCodes } from "./recovery.service";
import { UAParser } from "ua-parser-js";

// ========== ثبت نام کاربر جدید ==========
export async function registerUser(userData, requestMeta = {}) {
  await connectDB();
  
  const { name, email, phone } = userData;
  
  // بررسی تکراری نبودن ایمیل و تلفن
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
  
  // ایجاد کاربر جدید
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
  
  // لاگ امنیتی - با مقادیر صحیح
  await SecurityLog.create({
    userId: user._id,
    action: "REGISTER",        // ✅ الآن در Enum وجود دارد
    status: "success",
    ip: requestMeta.ip || "unknown",
    userAgent: requestMeta.userAgent || "unknown",
    details: { 
      email: email,
      phone: phone.slice(0, -4) + "****"  // فقط ۴ رقم آخر برای امنیت
    }
  });
  
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone
  };
}

// ========== لاگین با OTP (بعد از تأیید) ==========
// services/auth.service.js - بخش loginWithOtp
export async function loginWithOtp(identifier, inputCode, requestMeta = {}) {
  try {
    console.log("=== loginWithOtp START ===");
    console.log("identifier:", identifier);
    console.log("inputCode:", inputCode);
    
    await connectDB();
    
    // تشخیص نوع identifier
    const type = identifier.includes("@") ? "email" : "phone";
    console.log("type:", type);
    
    // تأیید OTP
    console.log("Calling verifyOtp...");
    const verifyResult = await verifyOtp(identifier, type, inputCode, requestMeta);
    console.log("verifyResult:", verifyResult);
    
    if (!verifyResult || !verifyResult.success || !verifyResult.userId) {
      console.log("Invalid verifyResult");
      throw new Error("کد تأیید نامعتبر است");
    }
    
    const userId = verifyResult.userId;
    console.log("userId:", userId);
    
    const user = await User.findById(userId);
    console.log("user found:", !!user);
    
    if (!user) {
      throw new Error("کاربر یافت نشد");
    }
    
    if (!user.isActive) {
      throw new Error("حساب کاربری غیرفعال است");
    }
    
    // بررسی قفل بودن حساب
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil - new Date()) / 60000);
      throw new Error(`حساب کاربری به مدت ${remainingMinutes} دقیقه قفل شده است`);
    }
    
    // تجزیه userAgent
    const parser = new UAParser(requestMeta.userAgent);
    const deviceInfo = parser.getResult();
    
    // تولید sessionId
    const sessionId = generateSessionId();
    
    // بررسی دستگاه trusted
    let isTrustedDevice = false;
    const existingDevice = await TrustedDevice.findOne({
      userId: user._id,
      userAgent: requestMeta.userAgent,
      isActive: true
    });
    
    if (existingDevice) {
      isTrustedDevice = true;
      existingDevice.lastUsedAt = new Date();
      existingDevice.lastUsedIp = requestMeta.ip;
      await existingDevice.save();
    }
    
    // ایجاد session
    const session = await Session.create({
      userId: user._id,
      sessionId,
      tokenHash: "pending",
      deviceName: deviceInfo.device.model || `${deviceInfo.browser.name} on ${deviceInfo.os.name}`,
      deviceType: deviceInfo.device.type || "desktop",
      browser: deviceInfo.browser.name || "Unknown",
      os: deviceInfo.os.name || "Unknown",
      userAgent: requestMeta.userAgent,
      ip: requestMeta.ip,
      isValid: true,
      isTrusted: isTrustedDevice,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    console.log("Session created:", session._id);
    
    // تولید JWT
    const token = signToken(user._id.toString(), sessionId);
    
    // به‌روزرسانی آخرین لاگین کاربر
    user.lastLoginAt = new Date();
    user.lastLoginIp = requestMeta.ip;
    user.lastLoginDevice = requestMeta.userAgent;
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockedUntil = null;
    await user.save();
    
    // لاگ امنیتی
    await SecurityLog.create({
      userId: user._id,
      action: "LOGIN_SUCCESS",
      status: "success",
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      details: { sessionId, isTrusted: isTrustedDevice }
    });
    
    // تولید کدهای بازیابی در صورت نیاز
    let recoveryCodes = null;
    const recoveryCodesCount = await RecoveryCode.countDocuments({ userId: user._id });
    if (recoveryCodesCount === 0) {
      recoveryCodes = await generateUserRecoveryCodes(user._id, requestMeta);
    }
    
    const result = {
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
      isTrustedDevice,
      recoveryCodes
    };
    
    console.log("✅ loginWithOtp returning success");
    return result;
    
  } catch (error) {
    console.error("❌ loginWithOtp error:", error);
    console.error("Error stack:", error.stack);
    throw error;
  }
}

// ========== لاگ اوت ==========
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
      details: { sessionId }
    });
  }
  
  return true;
}


// دریافت اطلاعات کاربر جاری با ID
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
// ========== بستن تمام sessionها (به جز جاری) ==========
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
    userAgent: requestMeta.userAgent
  });
  
  return true;
}

// ========== اعتبارسنجی session ==========
export async function validateSession(sessionId, userId) {
  await connectDB();
  
  const session = await Session.findOne({
    sessionId,
    userId,
    isValid: true,
    expiresAt: { $gt: new Date() }
  });
  
  if (!session) {
    return false;
  }
  
  session.lastActive = new Date();
  await session.save();
  
  return session;
}