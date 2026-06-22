import connectDB from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";
import RecoveryCode from "@/models/RecoveryCode";
import SecurityLog from "@/models/SecurityLog";
import TrustedDevice from "@/models/TrustedDevice";
import { signToken } from "@/lib/jwt";
import { generateSessionId } from "@/lib/hash";
import { generateUserRecoveryCodes } from "@/services/recovery.service";
import trustScoreService from "@/services/trustScore.service";
import { UAParser } from "ua-parser-js";

export async function completeLogin(userId, deviceId, requestMeta = {}) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new Error("حساب کاربری غیرفعال است");
  }

  if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
    const remaining = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw new Error(`حساب کاربری ${remaining} دقیقه دیگر قفل است`);
  }

  const parser = new UAParser(requestMeta.userAgent || "");
  const deviceInfo = parser.getResult();
  const sessionId = generateSessionId();

  let isTrustedDevice = false;
  let existingDevice = await TrustedDevice.findOne({
    userId: user._id,
    deviceId,
    isActive: true,
  });

  if (existingDevice) {
    isTrustedDevice = true;
    existingDevice.lastUsedAt = new Date();
    existingDevice.lastUsedIp = requestMeta.ip;
    existingDevice.loginCount += 1;
    await existingDevice.save();
  } else {
    existingDevice = await TrustedDevice.create({
      userId: user._id,
      deviceId,
      deviceName:
        deviceInfo.device.model ||
        `${deviceInfo.browser.name || "Browser"} on ${deviceInfo.os.name || "OS"}`,
      deviceType: deviceInfo.device.type || "desktop",
      browser: deviceInfo.browser.name || "Unknown",
      os: deviceInfo.os.name || "Unknown",
      userAgent: requestMeta.userAgent,
      lastUsedIp: requestMeta.ip,
      loginCount: 1,
    });
  }

  await Session.create({
    userId: user._id,
    sessionId,
    deviceId,
    deviceName: existingDevice.deviceName,
    deviceType: existingDevice.deviceType,
    browser: existingDevice.browser,
    os: existingDevice.os,
    userAgent: requestMeta.userAgent,
    ip: requestMeta.ip,
    location: requestMeta.location,
    isValid: true,
    isTrusted: isTrustedDevice,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

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
    details: {
      sessionId,
      isTrusted: isTrustedDevice,
      usedOTP: requestMeta.usedOTP || false,
      usedBackupCode: requestMeta.usedBackupCode || false,
    },
  });

  let recoveryCodes = null;
  const recoveryCount = await RecoveryCode.countDocuments({ userId: user._id });
  if (recoveryCount === 0) {
    recoveryCodes = await generateUserRecoveryCodes(user._id, requestMeta);
  }

  await trustScoreService.updateTrustScore(user._id, {
    isSuccessful: true,
    usedOTP: requestMeta.usedOTP || false,
    usedBackupCode: requestMeta.usedBackupCode || false,
    noOTPNeeded: requestMeta.noOTPNeeded || false,
    deviceId,
    location: requestMeta.location,
    isTrustedDevice,
    userAgent: requestMeta.userAgent,
    ip: requestMeta.ip,
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
    },
    token,
    sessionId,
    deviceId,
    isTrustedDevice,
    recoveryCodes,
  };
}

export async function logLoginAttempt(userId, status, requestMeta = {}, details = {}) {
  await connectDB();
  await SecurityLog.create({
    userId,
    action: status === "success" ? "LOGIN_ATTEMPT_SUCCESS" : "LOGIN_ATTEMPT_FAILED",
    status,
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    deviceId: requestMeta.deviceId,
    details,
  });
}

export async function logBlockedLogin(userId, requestMeta = {}, trustScore = 0) {
  await connectDB();
  await SecurityLog.create({
    userId,
    action: "LOGIN_BLOCKED",
    status: "failed",
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    deviceId: requestMeta.deviceId,
    details: { trustScore, reason: "CRITICAL_RISK" },
  });

  await trustScoreService.updateTrustScore(userId, {
    isSuccessful: false,
    deviceId: requestMeta.deviceId,
    ip: requestMeta.ip,
  });
}
