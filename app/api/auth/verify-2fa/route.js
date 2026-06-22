import twoFactorService from "@/services/twoFactor.service";
import { completeLogin } from "@/services/login.service";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, getUserAgent } from "@/lib/request";
import { jsonWithAuthCookie } from "@/lib/cookies";
import { errorResponse } from "@/lib/utils/response";

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    const rateLimitResult = await rateLimit(ip, "verify-2fa", 10, 60);
    if (!rateLimitResult.success) {
      return errorResponse("تعداد تلاش‌های بیش از حد", 429);
    }

    const body = await req.json().catch(() => ({}));
    const { sessionId, type, code, deviceId } = body;

    if (!sessionId || !code || !type) {
      return errorResponse("اطلاعات ناقص است", 400);
    }

    const requestMeta = { ip, userAgent, deviceId };

    const result = await twoFactorService.verifyOtpForSession(
      sessionId,
      code,
      type,
      requestMeta
    );

    if (result.requiresRecoveryCode) {
      return errorResponse("OTP تأیید شد — کد بازیابی را وارد کنید", 200, {
        verified: true,
        completed: false,
        nextStep: "recovery",
        sessionId,
        requiresRecoveryCode: true,
      });
    }

    if (!result.completed) {
      return errorResponse("مرحله بعد را تکمیل کنید", 200, {
        verified: true,
        completed: false,
        nextStep: result.nextStep,
        sessionId,
      });
    }

    const loginResult = await completeLogin(result.userId, result.deviceId || deviceId, {
      ...requestMeta,
      usedOTP: true,
    });

    return jsonWithAuthCookie(
      "ورود موفقیت‌آمیز بود",
      {
        user: loginResult.user,
        isTrustedDevice: loginResult.isTrustedDevice,
        completed: true,
        deviceId: loginResult.deviceId,
      },
      loginResult.token
    );
  } catch (error) {
    console.error("VERIFY 2FA ERROR:", error);
    return errorResponse(error.message || "خطا در تأیید", 401);
  }
}
