// services/recovery.service.js
import connectDB from "@/lib/db";
import RecoveryCode from "@/models/RecoveryCode";
import User from "@/models/User";
import SecurityLog from "@/models/SecurityLog";
import Session from "@/models/Session";
import { hashValue, compareValue, generateSecureCode } from "@/lib/hash"; // ✅ اضافه کردن compareValue

export async function generateUserRecoveryCodes(userId, requestMeta = {}) {
  await connectDB();
  
  await RecoveryCode.deleteMany({ userId });
  
  const rawCodes = [];
  const records = [];
  
  for (let i = 0; i < 10; i++) {
    const raw = generateSecureCode(8, "hex");
    const hashed = await hashValue(raw);
    
    rawCodes.push(raw);
    records.push({
      userId,
      codeHash: hashed,
      used: false,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
  }
  
  await RecoveryCode.insertMany(records);
  
  await SecurityLog.create({
    userId,
    action: "RECOVERY_CODES_GENERATED",
    status: "success",
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    deviceId: requestMeta.deviceId,
    details: { codesCount: 10 }
  });
  
  console.log(`✅ Generated ${rawCodes.length} recovery codes:`, rawCodes);
  return rawCodes;
}

export async function useRecoveryCode(userId, inputCode, requestMeta = {}) {
  await connectDB();
  
  console.log("🔐 useRecoveryCode called:", { userId, inputCode });
  
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("کاربر یافت نشد");
  }
  
  if (user.recoveryLockUntil && user.recoveryLockUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.recoveryLockUntil - new Date()) / 60000);
    throw new Error(`حساب شما به مدت ${remainingMinutes} دقیقه قفل شده است`);
  }
  
  // ✅ پیدا کردن همه کدهای استفاده نشده
  const allCodes = await RecoveryCode.find({
    userId,
    used: false,
    expiresAt: { $gt: new Date() }
  });
  
  console.log(`🔍 Found ${allCodes.length} unused recovery codes`);
  
  if (allCodes.length === 0) {
    throw new Error("کد بازیابی یافت نشد. لطفاً کدهای جدید تولید کنید.");
  }
  
  let matchedCode = null;
  
  // ✅ حلقه زدن روی کدها و مقایسه با compareValue
  for (const recoveryCode of allCodes) {
    const isMatch = await compareValue(inputCode, recoveryCode.codeHash);
    console.log(`  - Comparing with code hash: ${recoveryCode.codeHash?.slice(0, 20)}... Match: ${isMatch}`);
    if (isMatch) {
      matchedCode = recoveryCode;
      break;
    }
  }
  
  if (!matchedCode) {
    // تلاش ناموفق
    user.failedRecoveryAttempts = (user.failedRecoveryAttempts || 0) + 1;
    
    if (user.failedRecoveryAttempts >= 5) {
      user.recoveryLockUntil = new Date(Date.now() + 30 * 60 * 1000);
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
  
  // ✅ کد پیدا شد - علامت‌گذاری به عنوان استفاده شده
  matchedCode.used = true;
  matchedCode.usedAt = new Date();
  await matchedCode.save();
  
  user.failedRecoveryAttempts = 0;
  user.recoveryLockUntil = null;
  await user.save();
  
  // بستن تمام سشن‌های قبلی
  await Session.updateMany(
    { userId, isValid: true },
    { isValid: false }
  );
  
  await SecurityLog.create({
    userId,
    action: "RECOVERY_CODE_USED",
    status: "success",
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    deviceId: requestMeta.deviceId,
    details: { recoveryCodeId: matchedCode._id }
  });
  
  console.log(`✅ Recovery code ${matchedCode._id} used successfully`);
  return true;
}

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
    available: totalCodes - usedCodes - expiredCodes,
    expired: expiredCodes,
    hasActiveCodes: (totalCodes - usedCodes - expiredCodes) > 0
  };
}