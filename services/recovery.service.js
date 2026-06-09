// services/recovery.service.js
import connectDB from "@/lib/db";
import RecoveryCode from "@/models/RecoveryCode";
import User from "@/models/User";
import SecurityLog from "@/models/SecurityLog";
import Session from "@/models/Session";
import { hashValue, compareValue, generateSecureCode } from "@/lib/hash";
import crypto from "crypto";

// تولید کدهای بازیابی برای کاربر (فقط بعد از احراز هویت کامل)
export async function generateUserRecoveryCodes(userId, requestMeta = {}) {
  await connectDB();
  
  // حذف کدهای قدیمی
  await RecoveryCode.deleteMany({ userId });
  
  const rawCodes = [];
  const records = [];
  
  // تولید 10 کد بازیابی 8 رقمی HEX
  for (let i = 0; i < 10; i++) {
    const raw = generateSecureCode(8, "hex");
    const hashed = await hashValue(raw);
    
    rawCodes.push(raw);
    records.push({
      userId,
      codeHash: hashed,
      used: false,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 سال
    });
  }
  
  await RecoveryCode.insertMany(records);
  
  // لاگ امنیتی
  await SecurityLog.create({
    userId,
    action: "RECOVERY_CODES_GENERATED",
    status: "success",
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    details: { codesCount: 10 }
  });
  
  return rawCodes;
}

// استفاده از کد بازیابی (بعد از تأیید OTP)
export async function useRecoveryCode(userId, inputCode, requestMeta = {}) {
  await connectDB();
  
  // پیدا کردن کاربر و بررسی قفل بودن
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("کاربر یافت نشد");
  }
  
  // بررسی قفل بازیابی
  if (user.recoveryLockUntil && user.recoveryLockUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.recoveryLockUntil - new Date()) / 60000);
    throw new Error(`حساب شما به مدت ${remainingMinutes} دقیقه قفل شده است`);
  }
  
  // هش کردن کد ورودی برای جستجوی مستقیم
  const inputHash = await hashValue(inputCode);
  
  // جستجوی کد استفاده نشده و منقضی نشده
  const recoveryCode = await RecoveryCode.findOne({
    userId,
    codeHash: inputHash,
    used: false,
    expiresAt: { $gt: new Date() }
  });
  
  if (!recoveryCode) {
    // ثبت تلاش ناموفق
    user.failedRecoveryAttempts = (user.failedRecoveryAttempts || 0) + 1;
    
    // قفل کردن بعد از 5 تلاش ناموفق
    if (user.failedRecoveryAttempts >= 5) {
      user.recoveryLockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 دقیقه
      user.failedRecoveryAttempts = 0;
      
      await SecurityLog.create({
        userId,
        action: "ACCOUNT_LOCKED",
        status: "failed",
        ip: requestMeta.ip,
        userAgent: requestMeta.userAgent,
        details: { reason: "EXCESSIVE_RECOVERY_ATTEMPTS" }
      });
    }
    
    await user.save();
    
    await SecurityLog.create({
      userId,
      action: "RECOVERY_FAILED",
      status: "failed",
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      details: { attempt: user.failedRecoveryAttempts }
    });
    
    throw new Error("کد بازیابی نامعتبر است یا قبلاً استفاده شده");
  }
  
  // علامت‌گذاری کد به عنوان استفاده شده
  recoveryCode.used = true;
  recoveryCode.usedAt = new Date();
  await recoveryCode.save();
  
  // ریست تلاش‌های ناموفق
  user.failedRecoveryAttempts = 0;
  user.recoveryLockUntil = null;
  await user.save();
  
  // بی‌اثر کردن تمام sessionهای قبلی (امنیت بالا)
  await Session.updateMany(
    { userId, isValid: true },
    { isValid: false }
  );
  
  // لاگ موفقیت
  await SecurityLog.create({
    userId,
    action: "RECOVERY_CODE_USED",
    status: "success",
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    details: { recoveryCodeId: recoveryCode._id }
  });
  
  return true;
}

// بررسی وضعیت کدهای بازیابی کاربر
export async function getUserRecoveryCodesStatus(userId) {
  await connectDB();
  
  const totalCodes = await RecoveryCode.countDocuments({ userId });
  const usedCodes = await RecoveryCode.countDocuments({ userId, used: true });
  const expiredCodes = await RecoveryCode.countDocuments({ 
    userId, 
    expiresAt: { $lt: new Date() } 
  });
  
  return {
    total: totalCodes,
    used: usedCodes,
    available: totalCodes - usedCodes,
    expired: expiredCodes,
    hasActiveCodes: (totalCodes - usedCodes - expiredCodes) > 0
  };
}

// ریست کردن کدهای بازیابی (در صورت لو رفتن)
export async function resetRecoveryCodes(userId, requestMeta = {}) {
  await connectDB();
  
  await RecoveryCode.deleteMany({ userId });
  const newCodes = await generateUserRecoveryCodes(userId, requestMeta);
  
  await SecurityLog.create({
    userId,
    action: "RECOVERY_CODES_RESET",
    status: "success",
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent
  });
  
  return newCodes;
}