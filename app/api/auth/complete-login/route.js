import twoFactorService from "@/services/twoFactor.service";
import { useRecoveryCode } from "@/services/recovery.service";
import { completeLogin } from "@/services/login.service";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, getUserAgent } from "@/lib/request";
import { jsonWithAuthCookie } from "@/lib/cookies";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { verifyRecoverySchema } from "@/lib/validators/auth.schema";

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    const rateLimitResult = await rateLimit(ip, "verify-recovery", 5, 60);
    if (!rateLimitResult.success) {
      return errorResponse("تعداد تلاش‌های بیش از حد", 429);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = verifyRecoverySchema.safeParse({
      sessionId: body.sessionId,
      recoveryCode: body.recoveryCode || body.code,
      deviceId: body.deviceId,
    });

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message || "داده نامعتبر", 400);
    }

    const { sessionId, recoveryCode, deviceId } = parsed.data;
    const requestMeta = { ip, userAgent, deviceId };

    const session = await twoFactorService.get2FASession(sessionId);
    if (!session) {
      return errorResponse("جلسه تأیید معتبر نیست", 400);
    }

    if (!session.requiresRecoveryCode) {
      return errorResponse("این جلسه نیاز به کد بازیابی ندارد", 400);
    }

    const otpDone =
      (session.emailOtpId ? session.steps.emailVerified : true) &&
      (session.phoneOtpId ? session.steps.phoneVerified : true);

    if (!otpDone) {
      return errorResponse("ابتدا کد OTP را تأیید کنید", 400);
    }

    await useRecoveryCode(session.userId, recoveryCode.toUpperCase(), requestMeta);
    await twoFactorService.markRecoveryVerified(sessionId);

    const loginResult = await completeLogin(
      session.userId,
      deviceId || session.deviceId,
      {
        ...requestMeta,
        usedOTP: true,
        usedBackupCode: true,
      }
    );

    return jsonWithAuthCookie(
      "ورود با OTP و کد بازیابی موفق بود",
      {
        user: loginResult.user,
        isTrustedDevice: loginResult.isTrustedDevice,
      },
      loginResult.token
    );
  } catch (error) {
    console.error("COMPLETE LOGIN ERROR:", error);
    return errorResponse(error.message || "خطا در تکمیل ورود", 401);
  }
}
