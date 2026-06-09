// services/otp.service.js - نسخه اصلاح شده بدون تکرار
import connectDB from "@/lib/db";
import Otp from "@/models/Otp";
import User from "@/models/User";
import SecurityLog from "@/models/SecurityLog";
import { hashValue, compareValue, generateSecureCode } from "@/lib/hash";
import { sendEmailOtp, sendSmsOtp } from "./mail.service";

// ارسال OTP
export async function sendOtp(identifier, type, requestMeta = {}) {
  await connectDB();
  
  let user = null;
  if (type === "email") {
    user = await User.findOne({ email: identifier });
  } else if (type === "phone") {
    user = await User.findOne({ phone: identifier });
  }
  
  console.log("=== SEND OTP DEBUG ===");
  console.log("identifier:", identifier);
  console.log("type:", type);
  console.log("user found:", !!user);
  
  if (!user) {
    console.log(`[SECURITY] OTP requested for non-existent ${type}: ${identifier}`);
    return { 
      success: true, 
      otpId: null,
      message: "در صورت وجود حساب کاربری، کد تأیید ارسال خواهد شد"
    };
  }
  
  // حذف OTPهای قبلی استفاده نشده
  await Otp.deleteMany({ 
    identifier, 
    type, 
    used: false,
    expiresAt: { $gt: new Date() }
  });
  
  // تولید کد 6 رقمی
  const rawCode = generateSecureCode(6, "number");
  const hashedCode = await hashValue(rawCode);
  
  // لاگ کد در کنسول ترمینال
  console.log("=========================================");
  console.log(`🔐 OTP CODE: ${rawCode}`);
  console.log(`📬 Sent to: ${type} - ${identifier}`);
  console.log(`⏰ Expires in: 5 minutes`);
  console.log("=========================================");
  
  // ذخیره در دیتابیس
  const otp = await Otp.create({
    identifier: identifier,
    type: type,
    codeHash: hashedCode,
    attempts: 0,
    maxAttempts: 5,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });
  
  console.log("✅ OTP saved to database with id:", otp._id);
  
  // در محیط توسعه، فقط لاگ می‌زنیم
  if (process.env.NODE_ENV === "development") {
    console.log(`📧 [DEV MODE] Email/SMS would be sent to ${identifier} with code: ${rawCode}`);
  } else {
    // در محیط production ایمیل واقعی بفرست
    if (type === "email") {
      await sendEmailOtp(identifier, rawCode);
    } else if (type === "phone") {
      await sendSmsOtp(identifier, rawCode);
    }
  }
  
  // لاگ امنیتی
  await SecurityLog.create({
    userId: user._id,
    action: "OTP_SENT",
    status: "success",
    ip: requestMeta.ip || "unknown",
    userAgent: requestMeta.userAgent || "unknown",
    details: { 
      type, 
      identifier: identifier.slice(0, -4) + "****" 
    }
  });
  
  return { success: true, otpId: otp._id };
}

// تأیید OTP (فقط یک بار تعریف شده)
export async function verifyOtp(identifier, type, inputCode, requestMeta = {}) {
  try {
    console.log("=== VERIFY OTP START ===");
    console.log("identifier:", identifier);
    console.log("type:", type);
    console.log("inputCode:", inputCode);
    
    await connectDB();
    console.log("✅ Database connected");
    
    const otpRecord = await Otp.findOne({
      identifier,
      type,
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    console.log("otpRecord found:", !!otpRecord);
    if (otpRecord) {
      console.log("otpRecord.id:", otpRecord._id);
      console.log("otpRecord.expiresAt:", otpRecord.expiresAt);
      console.log("otpRecord.used:", otpRecord.used);
      console.log("otpRecord.attempts:", otpRecord.attempts);
    }
    
    if (!otpRecord) {
      console.log("❌ OTP record not found or expired");
      throw new Error("کد منقضی شده یا نامعتبر است");
    }
    
    console.log("✅ OTP record found, checking code...");
    
    if (otpRecord.lockedUntil && otpRecord.lockedUntil > new Date()) {
      const remainingSeconds = Math.ceil((otpRecord.lockedUntil - new Date()) / 1000);
      console.log("OTP is locked for:", remainingSeconds, "seconds");
      throw new Error(`لطفاً ${remainingSeconds} ثانیه بعد دوباره تلاش کنید`);
    }
    
    otpRecord.attempts += 1;
    console.log("Attempt count:", otpRecord.attempts);
    
    const isMatch = await compareValue(inputCode, otpRecord.codeHash);
    console.log("Code match result:", isMatch);
    
    if (!isMatch) {
      console.log("Code mismatch!");
      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        otpRecord.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        console.log("Max attempts reached, locking until:", otpRecord.lockedUntil);
        
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
    
    console.log("✅ Code matched, updating OTP record...");
    otpRecord.used = true;
    otpRecord.usedAt = new Date();
    await otpRecord.save();
    console.log("OTP marked as used");
    
    console.log("Looking for user with:", type, identifier);
    let user = null;
    if (type === "email") {
      user = await User.findOne({ email: identifier });
    } else if (type === "phone") {
      user = await User.findOne({ phone: identifier });
    }
    
    console.log("User found:", !!user);
    if (user) {
      console.log("User ID:", user._id);
      console.log("User email:", user.email);
      console.log("User phone:", user.phone);
    }
    
    if (!user) {
      console.log("❌ User not found for identifier:", identifier);
      throw new Error("کاربر یافت نشد");
    }
    
    await SecurityLog.create({
      userId: user._id,
      action: "OTP_VERIFIED",
      status: "success",
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      details: { type }
    });
    console.log("Security log created");
    
    const result = { success: true, userId: user._id };
    console.log("✅ verifyOtp returning:", result);
    return result;
    
  } catch (error) {
    console.error("❌ verifyOtp error:", error);
    console.error("Error stack:", error.stack);
    throw error;
  }
}