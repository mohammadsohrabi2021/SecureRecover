// app/api/auth/verify-otp/route.js
import { loginWithOtp } from "@/services/auth.service";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { createAuthCookie } from "@/lib/cookies";
import { rateLimit } from "@/lib/rate-limit";
import TwoFactorAuth from "@/models/TwoFactorAuth";
import connectDB from "@/lib/db";

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    const rateLimitResult = await rateLimit(ip, "verify-otp", 5, 60);
    if (!rateLimitResult.success) {
      return errorResponse("تعداد تلاش‌های بیش از حد. لطفاً ۱ دقیقه دیگر تلاش کنید.", 429);
    }
    
    const body = await req.json().catch(() => ({}));
    console.log("Verify OTP body:", body);
    
    let identifier = body.identifier || body.email || body.phone;
    let code = body.code || body.otp;
    let deviceId = body.deviceId;
    let sessionId = body.sessionId;
    
    if (!identifier || !code) {
      return errorResponse("شناسه کاربری و کد تأیید الزامی است", 400);
    }
    
    // ✅ تشخیص type از TwoFactorAuth بر اساس sessionId
    let type = null;
    if (sessionId) {
      await connectDB();
      const twoFactorSession = await TwoFactorAuth.findOne({ sessionId });
      if (twoFactorSession) {
        if (twoFactorSession.phoneOtpId) {
          type = "phone";
          console.log("🔍 Detected type from phoneOtpId: phone");
        } else if (twoFactorSession.emailOtpId) {
          type = "email";
          console.log("🔍 Detected type from emailOtpId: email");
        }
      }
    }
    
    // اگر با sessionId نتونستیم تشخیص بدیم، از identifier تشخیص بده
    if (!type) {
      type = identifier.includes("@") ? "email" : "phone";
    }
    
    console.log(`🔍 Final detected type: ${type} for identifier: ${identifier}`);
    
    const userAgent = req.headers.get("user-agent") || "unknown";
    const requestMeta = { 
      ip, 
      userAgent, 
      deviceId: deviceId || undefined,
      sessionId 
    };
    
    console.log("🔑 requestMeta.deviceId:", requestMeta.deviceId);
    
    // ✅ ارسال type به loginWithOtp
    const result = await loginWithOtp(identifier, code, requestMeta, type);
    
    if (!result || !result.user) {
      console.error("loginWithOtp returned invalid result:", result);
      return errorResponse("خطا در پردازش درخواست", 500);
    }
    
    const { user: userData, token, isTrustedDevice, recoveryCodes } = result;
    
    const res = successResponse("ورود موفقیت‌آمیز بود", {
      user: userData,
      isTrustedDevice: isTrustedDevice || false,
      recoveryCodes: recoveryCodes || undefined
    });
    
    res.headers.set("Set-Cookie", createAuthCookie(token));
    
    return res;
    
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    
    let status = 500;
    let message = error.message || "خطایی رخ داده است";
    
    if (message.includes("نامعتبر") || message.includes("منقضی")) {
      status = 401;
    } else if (message.includes("قفل")) {
      status = 423;
    } else if (message.includes("یافت نشد")) {
      status = 404;
    }
    
    return errorResponse(message, status);
  }
}