import User from "@/models/User";
import connectDB from "@/lib/db";
import trustScoreService from "@/services/trustScore.service";
import twoFactorService from "@/services/twoFactor.service";
import { createAdminApproval } from "@/services/admin.service";
import { userHasRecoveryCodes } from "@/services/approval.service";
import { completeLogin, logBlockedLogin } from "@/services/login.service";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { generateDeviceId } from "@/lib/hash";
import { jsonWithAuthCookie } from "@/lib/cookies";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { loginRequestSchema } from "@/lib/validators/auth.schema";
import { REQUIRED_ACTIONS, TRUST_LEVELS } from "@/types/trust";

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const rateLimitResult = await rateLimit(ip, "login-request", 5, 60);
    if (!rateLimitResult.success) {
      return errorResponse("تعداد درخواست‌های بیش از حد. لطفاً بعداً تلاش کنید.", 429);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = loginRequestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message || "داده نامعتبر", 400);
    }

    const { identifier } = parsed.data;
    const deviceId = parsed.data.deviceId || generateDeviceId();

    await connectDB();

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    });

    if (!user) {
      return errorResponse("کاربر یافت نشد. لطفاً ابتدا ثبت‌نام کنید.", 404, {
        requiredAction: "REGISTER_FIRST",
        redirectTo: "/register",
      });
    }

    if (!user.isActive) {
      return errorResponse("حساب کاربری غیرفعال است", 403);
    }

    const requestMeta = await getRequestMeta(req, deviceId);
    const trust = await trustScoreService.calculateTrustLevel(user._id, deviceId, requestMeta);

    switch (trust.requiredAction) {
      case REQUIRED_ACTIONS.NONE: {
        const result = await completeLogin(user._id, deviceId, {
          ...requestMeta,
          noOTPNeeded: true,
        });

        return jsonWithAuthCookie(
          "ورود موفق — سطح اعتماد بالا",
          {
            trustLevel: trust.level,
            requiredAction: REQUIRED_ACTIONS.NONE,
            score: trust.score,
            user: result.user,
            deviceId,
          },
          result.token
        );
      }

      case REQUIRED_ACTIONS.ADMIN_APPROVAL:
      case REQUIRED_ACTIONS.BLOCK: {
        await logBlockedLogin(user._id, requestMeta, trust.score);

        const approval = await createAdminApproval(
          user._id,
          deviceId,
          identifier,
          trust.score,
          requestMeta
        );

        return errorResponse(
          "سطح امنیت بحرانی — ورود مسدود شد. درخواست تأیید ادمین ارسال شد.",
          403,
          {
            requiredAction: REQUIRED_ACTIONS.ADMIN_APPROVAL,
            trustLevel: TRUST_LEVELS.CRITICAL,
            trustScore: trust.score,
            requestId: approval._id,
            status: "pending",
          }
        );
      }

      case REQUIRED_ACTIONS.OTP:
      case REQUIRED_ACTIONS.OTP_AND_RECOVERY: {
        const isEmailLogin = identifier.includes("@");
        const needsRecovery = trust.requiredAction === REQUIRED_ACTIONS.OTP_AND_RECOVERY;
        const hasRecoveryCodes = needsRecovery ? await userHasRecoveryCodes(user._id) : true;

        const twoFactorResult = await twoFactorService.initiate2FA(
          user._id,
          deviceId,
          {
            sendToEmail: !isEmailLogin,
            sendToPhone: isEmailLogin,
            requiresRecoveryCode: needsRecovery && hasRecoveryCodes,
            canRequestAdminApproval: needsRecovery,
            trustLevel: trust.level,
          },
          requestMeta
        );

        const verifyIdentifier = isEmailLogin ? user.phone : user.email;
        const verifyType = isEmailLogin ? "phone" : "email";

        let message = "کد تأیید ۶ رقمی ارسال شد.";
        if (needsRecovery && hasRecoveryCodes) {
          message = "کد تأیید ارسال شد. پس از تأیید، کد بازیابی نیز لازم است.";
        } else if (needsRecovery && !hasRecoveryCodes) {
          message =
            "کد تأیید ارسال شد. کد بازیابی ندارید — پس از OTP می‌توانید درخواست تأیید ادمین دهید.";
        }

        return successResponse(message, {
          requiredAction: "2FA",
          sessionId: twoFactorResult.sessionId,
          deviceId,
          trustLevel: trust.level,
          trustScore: trust.score,
          requiresRecoveryCode: needsRecovery && hasRecoveryCodes,
          canRequestAdminApproval: needsRecovery,
          hasRecoveryCodes,
          identifier: verifyIdentifier,
          verifyType,
          message,
          expiresIn: 600,
        });
      }

      default:
        return errorResponse("خطا در تعیین مرحله احراز هویت", 500);
    }
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return errorResponse(error.message || "خطا در فرآیند ورود", 500);
  }
}
