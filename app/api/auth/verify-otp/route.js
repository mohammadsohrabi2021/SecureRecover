import twoFactorService from "@/services/twoFactor.service";
import { completeLogin } from "@/services/login.service";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, getUserAgent } from "@/lib/request";
import { jsonWithAuthCookie } from "@/lib/cookies";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { verifyOtpSchema } from "@/lib/validators/auth.schema";
import { getIdentifierType } from "@/lib/validators/auth.schema";

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    const rateLimitResult = await rateLimit(ip, "verify-otp", 5, 60);
    if (!rateLimitResult.success) {
      return errorResponse("تعداد تلاش‌های بیش از حد. لطفاً ۱ دقیقه دیگر تلاش کنید.", 429);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = verifyOtpSchema.safeParse({
      identifier: body.identifier || body.email || body.phone,
      code: body.code || body.otp,
      sessionId: body.sessionId,
      deviceId: body.deviceId,
      type: body.type,
    });

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message || "داده نامعتبر", 400);
    }

    const { identifier, code, sessionId, deviceId, type: explicitType } = parsed.data;

    if (!sessionId) {
      return errorResponse("شناسه جلسه تأیید الزامی است", 400);
    }

    const type = explicitType || getIdentifierType(identifier);
    if (!type) {
      return errorResponse("نوع شناسه نامعتبر است", 400);
    }

    const requestMeta = { ip, userAgent, deviceId };

    const result = await twoFactorService.verifyOtpForSession(
      sessionId,
      code,
      type,
      requestMeta
    );

    if (result.requiresRecoveryCode) {
      return successResponse("OTP تأیید شد — کد بازیابی را وارد کنید", {
        verified: true,
        completed: false,
        nextStep: "recovery",
        sessionId,
        requiresRecoveryCode: true,
        canRequestAdminApproval: result.trustLevel === "LOW",
        trustLevel: result.trustLevel,
      });
    }

    if (result.canRequestAdminApproval) {
      return successResponse("OTP تأیید شد — درخواست تأیید ادمین لازم است", {
        verified: true,
        completed: false,
        nextStep: "admin-approval",
        sessionId,
        canRequestAdminApproval: true,
        trustLevel: result.trustLevel,
      });
    }

    if (!result.completed) {
      return successResponse("مرحله بعد را تکمیل کنید", {
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
        recoveryCodes: loginResult.recoveryCodes,
      },
      loginResult.token
    );
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    let status = 401;
    if (error.message?.includes("قفل")) status = 423;

    return errorResponse(error.message || "خطا در تأیید کد", status);
  }
}
