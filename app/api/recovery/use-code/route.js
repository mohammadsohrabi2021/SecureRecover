// app/api/recovery/use-code/route.js
import { useRecoveryCode } from "@/services/recovery.service";
import { loginWithOtp } from "@/services/auth.service";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { createAuthCookie } from "@/lib/cookies";
import User from "@/models/User";
import connectDB from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, code, recoveryRequestId } = body;
    
    if (!email || !code) {
      return errorResponse("ایمیل و کد بازیابی الزامی است", 400);
    }
    
    // بررسی وجود recoveryRequest در cache (Redis یا در دیتابیس موقت)
    // این بخش نیاز به پیاده‌سازی دارد - فعلاً یک بررسی ساده
    if (!recoveryRequestId) {
      return errorResponse("درخواست بازیابی معتبر نیست", 400);
    }
    
    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse("کاربر یافت نشد", 404);
    }
    
    // استخراج IP و userAgent
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";
    
    // استفاده از کد بازیابی
    await useRecoveryCode(user._id, code, { ip, userAgent });
    
    // بعد از بازیابی موفق، کاربر باید دوباره با OTP لاگین کند
    // به جای صدور مستقیم توکن، یک توکن موقت برای تکمیل فرآیند صادر می‌کنیم
    const recoveryCompleteToken = Buffer.from(JSON.stringify({
      userId: user._id.toString(),
      verifiedAt: Date.now()
    })).toString("base64");
    
    const res = successResponse("کد بازیابی تأیید شد. لطفاً برای ادامه، کد تأیید دریافت کنید.", {
      recoveryCompleteToken,
      requiresOtp: true
    });
    
    return res;
    
  } catch (error) {
    console.error("USE RECOVERY CODE ERROR:", error);
    return errorResponse(error.message, 400);
  }
}