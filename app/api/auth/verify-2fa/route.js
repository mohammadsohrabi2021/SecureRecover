// app/api/auth/verify-2fa/route.js
import twoFactorService from "@/services/twoFactor.service";
import trustScoreService from "@/services/trustScore.service";
import { rateLimit } from "@/lib/rate-limit";
import { signToken } from "@/lib/jwt";
import { generateSessionId } from "@/lib/hash";
import Session from "@/models/Session";
import User from "@/models/User";
import SecurityLog from "@/models/SecurityLog";
import connectDB from "@/lib/db";
import { NextResponse } from "next/server";

function createSuccessResponseWithCookie(message, data, token, status = 200) {
  const isProduction = process.env.NODE_ENV === "production";
  
  const response = NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    },
    { status }
  );
  
  if (token) {
    response.cookies.set({
      name: "secure_recover_session",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 604800,
      path: "/",
      secure: isProduction
    });
    console.log("✅ Cookie set with token");
  }
  
  return response;
}

function createSuccessResponse(message, data, status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

function createErrorResponse(message, status = 400, data = null) {
  return NextResponse.json(
    {
      success: false,
      message,
      data,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

// تابع کمکی برای تکمیل لاگین
async function completeLogin(sessionId, deviceId, userAgent, ip, twoFactorSession) {
  const user = await User.findById(twoFactorSession.userId);
  if (!user) {
    throw new Error("کاربر یافت نشد");
  }
  
  const finalDeviceId = deviceId || twoFactorSession.deviceId;
  const finalSessionId = generateSessionId();
  
  await Session.create({
    userId: user._id,
    sessionId: finalSessionId,
    deviceId: finalDeviceId,
    deviceName: userAgent?.split(" ")[0] || "Unknown Device",
    userAgent,
    ip,
    isValid: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  
  const token = signToken(user._id.toString(), finalSessionId);
  
  await trustScoreService.increaseTrustScore(user._id, finalDeviceId, {
    used2FA: true,
    deviceName: userAgent?.split(" ")[0]
  });
  
  await SecurityLog.create({
    userId: user._id,
    action: "LOGIN_SUCCESS",
    status: "success",
    ip,
    userAgent,
    deviceId: finalDeviceId,
    details: { twoFactorCompleted: true, trustScoreIncreased: true }
  });
  
  return { token, user, deviceId: finalDeviceId }; 
}

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";
    
    const rateLimitResult = await rateLimit(ip, "verify-2fa", 10, 60);
    if (!rateLimitResult.success) {
      return createErrorResponse("تعداد تلاش‌های بیش از حد. لطفاً بعداً تلاش کنید.", 429);
    }
    
    const body = await req.json().catch(() => ({}));
    const { sessionId, type, code, deviceId } = body;
    
    console.log("🔐 Verify 2FA request:", { sessionId, type, codeLength: code?.length, deviceId });
    
    if (!sessionId || !code) {
      return createErrorResponse("اطلاعات ناقص است", 400);
    }
    
    let result;
    
    if (type === "email") {
      result = await twoFactorService.verifyEmailCode(sessionId, code, { ip });
      console.log("📧 Email verification result:", result);
    } else if (type === "phone") {
      result = await twoFactorService.verifyPhoneCode(sessionId, code, { ip });
      console.log("📱 Phone verification result:", result);
    } else {
      return createErrorResponse("نوع تأیید نامعتبر است", 400);
    }
    
    if (!result.success) {
      return createErrorResponse(result.message || "کد نامعتبر است", 401);
    }
    
    await connectDB();
    const twoFactorSession = await twoFactorService.get2FASession(sessionId);
    if (!twoFactorSession) {
      return createErrorResponse("جلسه تأیید معتبر نیست", 400);
    }
    
    // حالت partial: مرحله اول تأیید شده، مرحله دوم باقی مانده
    if (!result.completed && result.nextStep) {
      console.log("⏳ 2FA partial - next step:", result.nextStep);
      
      return createSuccessResponse(
        "کد تأیید شد. لطفاً مرحله بعد را کامل کنید.",
        {
          verified: true,
          completed: false,
          nextStep: result.nextStep,
          sessionId
        }
      );
    }
    
    // حالت completed یا وقتی nextStep وجود ندارد (MEDIUM trust - فقط یک مرحله)
    console.log("✅ 2FA completed or single step completed!");
    
    const { token, user } = await completeLogin(sessionId, deviceId, userAgent, ip, twoFactorSession);
    
    console.log("🚀 Login completed, redirecting to dashboard");
    
    return createSuccessResponseWithCookie(
      "ورود موفقیت‌آمیز بود",
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone
        },
        isTrustedDevice: true,
        completed: true,
        deviceId: finalDeviceId
      },
      token
    );
    
  } catch (error) {
    console.error("❌ VERIFY 2FA ERROR:", error);
    return createErrorResponse(error.message, 500);
  }
}