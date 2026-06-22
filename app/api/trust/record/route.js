// app/api/trust/record/route.js
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import connectDB from "@/lib/db";
import User from "@/models/User";
import TrustScore from "@/models/TrustScore";
import TrustEvent from "@/models/TrustEvent";
import SecurityLog from "@/models/SecurityLog";
import trustScoreService from "@/services/trustScore.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("secure_recover_session")?.value;
    
    if (!token) {
      return errorResponse("احراز هویت نشده", 401);
    }
    
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return errorResponse("توکن نامعتبر است", 401);
    }
    
    const body = await req.json().catch(() => ({}));
    const { 
      deviceId, 
      location, 
      isSuccessful = true, 
      usedOTP = false, 
      usedBackupCode = false,
      noOTPNeeded = false,
      deviceName = "Unknown Device"
    } = body;
    
    if (!deviceId) {
      return errorResponse("deviceId الزامی است", 400);
    }
    
    await connectDB();
    
    // ✅ پیدا کردن کاربر
    const user = await User.findById(decoded.userId);
    if (!user) {
      return errorResponse("کاربر یافت نشد", 404);
    }
    
    // 1️⃣ ذخیره TrustEvent
    const trustEvent = await TrustEvent.create({
      userId: user._id,
      deviceId,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      location: location || {},
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      isSuccessful,
      usedOTP,
      usedBackupCode,
      score: 0
    });
    
    // 2️⃣ به‌روزرسانی Trust Score
    let trustRecord = await TrustScore.findOne({ userId: user._id });
    if (!trustRecord) {
      trustRecord = await TrustScore.create({ 
        userId: user._id, 
        currentScore: 50,
        baseScore: 50,
        trustedDevices: [],
        unusualPatterns: [],
        trustHistory: []
      });
    }
    
    // محاسبه تغییر امتیاز
    let scoreChange = 0;
    let reason = "";
    
    if (isSuccessful) {
      if (noOTPNeeded) {
        scoreChange = 10;
        reason = "ورود موفق بدون کد (امتیاز بالا)";
      } else if (usedOTP) {
        scoreChange = 5;
        reason = "ورود موفق با کد یکبار مصرف";
      } else if (usedBackupCode) {
        scoreChange = 2;
        reason = "ورود موفق با کد پشتیبان";
      } else {
        scoreChange = 8;
        reason = "ورود موفق";
      }
    } else {
      scoreChange = -10;
      reason = "تلاش ناموفق برای ورود";
    }
    
    // اعمال تغییر امتیاز
    trustRecord.currentScore = Math.max(0, Math.min(100, trustRecord.currentScore + scoreChange));
    trustRecord.lastUpdated = new Date();
    trustRecord.lastLoginAt = new Date();
    
    if (location?.city) {
      trustRecord.lastLoginLocation = location.city;
    }

    if (isSuccessful) {
      await trustScoreService.upsertTrustedDeviceEntry(user._id, {
        deviceId,
        deviceName: deviceName || "New Device",
      });
      trustRecord = await TrustScore.findOne({ userId: user._id });
    }

    // ذخیره امتیاز در TrustEvent
    trustEvent.score = trustRecord.currentScore;
    trustEvent.scoreChange = scoreChange;
    trustEvent.reason = reason;
    await trustEvent.save();
    
    // ✅ ذخیره تاریخچه امتیاز
    trustRecord.trustHistory = trustRecord.trustHistory || [];
    trustRecord.trustHistory.push({
      score: trustRecord.currentScore,
      reason: reason,
      changedAt: new Date()
    });
    
    // محدود کردن تاریخچه به 50 مورد
    if (trustRecord.trustHistory.length > 50) {
      trustRecord.trustHistory = trustRecord.trustHistory.slice(-50);
    }
    
    await trustRecord.save();
    
    // 3️⃣ لاگ امنیتی
    await SecurityLog.create({
      userId: user._id,
      action: "TRUST_SCORE_UPDATED",
      status: isSuccessful ? "success" : "failed",
      deviceId,
      details: {
        scoreChange,
        newScore: trustRecord.currentScore,
        reason,
        location,
        isSuccessful
      }
    });
    
    return successResponse("الگوی ورود ثبت شد", { 
      success: true,
      newScore: trustRecord.currentScore,
      scoreChange,
      reason
    });
    
  } catch (error) {
    console.error("❌ Record pattern error:", error);
    return errorResponse(error.message || "خطا در ثبت الگوی ورود", 500);
  }
}