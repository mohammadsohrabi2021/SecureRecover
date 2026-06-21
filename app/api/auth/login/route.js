// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import User from "@/models/User";
import Session from "@/models/Session";
import connectDB from "@/lib/db";
import trustScoreService from "@/services/trustScore.service";
import twoFactorService from "@/services/twoFactor.service";
import { getGeoLocation, isSuspiciousIP } from "@/lib/utils/geo";
import { generateDeviceId, generateSessionId } from "@/lib/hash";
import { signToken } from "@/lib/jwt";
import SecurityLog from "@/models/SecurityLog";

// تابع کمکی برای ایجاد پاسخ موفق با کوکی
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
      sameSite: "strict",
      maxAge: 604800,
      path: "/",
      secure: isProduction
    });
  }
  
  return response;
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

export async function POST(req) {
  try {
    console.log("=== LOGIN API WITH TRUST SCORING + 2FA ===");
    
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";
    
    const rateLimitResult = await rateLimit(ip, "login-request", 5, 60);
    if (!rateLimitResult.success) {
      return createErrorResponse("تعداد درخواست‌های بیش از حد. لطفاً بعداً تلاش کنید.", 429);
    }
    
    const body = await req.json().catch(() => ({}));
    let identifier = body.identifier || body.email || body.phone;
    let deviceId = body.deviceId || generateDeviceId();
    
    if (!identifier) {
      return createErrorResponse("ایمیل یا شماره تلفن الزامی است", 400);
    }
    
    await connectDB();
    
    let user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });
    
    if (!user) {
      return createSuccessResponseWithCookie(
        "لطفاً پس از ثبت نام وارد شوید",
        {
          trustLevel: "UNKNOWN",
          requiredAction: "REGISTER_FIRST",
          redirectTo: "/register",
          message: "اگر قبلاً ثبت نام نکرده‌اید، لطفاً ابتدا ثبت نام کنید"
        },
        null
      );
    }
    
    const location = await getGeoLocation(ip);
    const suspiciousIP = await isSuspiciousIP(ip);
    
    const trustContext = {
      location,
      isSuspiciousIP: suspiciousIP,
      deviceId,
      ip,
      userAgent
    };
    
    const trustLevel = await trustScoreService.calculateTrustLevel(user._id, deviceId, trustContext);
    
    console.log(`📊 Trust Level for ${user.email}:`, {
      level: trustLevel.level,
      score: trustLevel.score,
      requiredAction: trustLevel.requiredAction
    });
    
    const requestMeta = { ip, userAgent, deviceId, location };
    
    const isLoginWithEmail = identifier.includes("@");
    console.log(`🔐 Login method: ${isLoginWithEmail ? "EMAIL" : "PHONE"}`);
    
    let requiredSteps = { email: false, phone: false };
    
    switch (trustLevel.requiredAction) {
      case "NONE":
        requiredSteps = { email: false, phone: false };
        console.log("✅ HIGH TRUST - No code needed");
        break;
        
      case "OTP":
        if (isLoginWithEmail) {
          requiredSteps = { email: false, phone: true };
          console.log("📱 MEDIUM TRUST - Sending OTP to PHONE");
        } else {
          requiredSteps = { email: true, phone: false };
          console.log("📧 MEDIUM TRUST - Sending OTP to EMAIL");
        }
        break;
        
      case "OTP_AND_BACKUP":
        requiredSteps = { email: true, phone: true };
        console.log("🔐 LOW TRUST - Sending OTP to BOTH");
        break;
        
      case "ADMIN_APPROVAL":
        await SecurityLog.create({
          userId: user._id,
          action: "CRITICAL_TRUST_LOGIN_ATTEMPT",
          status: "failed",
          ip,
          userAgent,
          deviceId,
          details: { trustScore: trustLevel.score, location }
        });
        
        return createErrorResponse(
          "سطح امنیت حساب شما بحرانی است. لطفاً با پشتیبانی تماس بگیرید.",
          403,
          { trustLevel: trustLevel.level, requiresAdminApproval: true }
        );
        
      default:
        requiredSteps = { email: true, phone: true };
        console.log("⚠️ DEFAULT - Sending OTP to BOTH");
    }
    
    // ========== حالت ورود مستقیم بدون کد (High Trust) ==========
    if (trustLevel.requiredAction === "NONE") {
      const sessionId = generateSessionId();
      
      await Session.create({
        userId: user._id,
        sessionId,
        deviceId,
        deviceName: "Trusted Device",
        userAgent,
        ip,
        location,
        isValid: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      const token = signToken(user._id.toString(), sessionId);
      
      await SecurityLog.create({
        userId: user._id,
        action: "LOGIN_SUCCESS",
        status: "success",
        ip,
        userAgent,
        deviceId,
        details: { trustScore: trustLevel.score, directLogin: true }
      });
      
      return createSuccessResponseWithCookie(
        "ورود موفق - سطح اعتماد بالا",
        {
          trustLevel: trustLevel.level,
          requiredAction: "NONE",
          score: trustLevel.score,
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          },
          deviceId: deviceId,
          message: "✅ سطح اعتماد بالا - ورود بدون نیاز به کد تأیید"
        },
        token
      );
    }
    
    // ========== شروع فرآیند 2FA ==========
    const twoFactorResult = await twoFactorService.initiate2FAWithSteps(
      user._id,
      deviceId,
      requiredSteps,
      requestMeta
    );
    
    let userMessage = "";
    if (requiredSteps.email && requiredSteps.phone) {
      userMessage = "🔐 برای امنیت بیشتر، کد تأیید به ایمیل و شماره تلفن شما ارسال شد";
    } else if (requiredSteps.email) {
      userMessage = "📧 کد تأیید ۶ رقمی به ایمیل شما ارسال شد";
    } else if (requiredSteps.phone) {
      userMessage = "📱 کد تأیید ۶ رقمی به شماره تلفن شما ارسال شد";
    }
    
    console.log(`📨 Response message: ${userMessage}`);
    
    // ✅ تعیین identifier صحیح برای مرحله verify
    let verifyIdentifier = identifier;
    if (requiredSteps.email && !requiredSteps.phone) {
      verifyIdentifier = user.email;
    } else if (requiredSteps.phone && !requiredSteps.email) {
      verifyIdentifier = user.phone;
    }
    
    console.log(`📨 verifyIdentifier: ${verifyIdentifier}`);
    
    return createSuccessResponseWithCookie(
      userMessage,
      {
        sessionId: twoFactorResult.sessionId,
        deviceId,
        trustLevel: trustLevel.level,
        trustScore: trustLevel.score,
        requiredAction: "2FA",
        requiresEmail: requiredSteps.email,
        requiresPhone: requiredSteps.phone,
        message: userMessage,
        expiresIn: 600,
        identifier: verifyIdentifier
      },
      null
    );
    
  } catch (error) {
    console.error("LOGIN REQUEST ERROR:", error);
    return createErrorResponse(error.message || "خطا در فرآیند ورود", 500);
  }
}