import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, getUserAgent } from "@/lib/request";
import { createLowTrustApprovalRequest } from "@/services/approval.service";
import TwoFactorAuth from "@/models/TwoFactorAuth";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { z } from "zod";

const schema = z.object({
  twoFactorSessionId: z.string().min(1),
  deviceId: z.string().min(1),
  identifier: z.string().min(1),
  trustScore: z.number().optional(),
  trustLevel: z.string().optional(),
  lostRecoveryCode: z.boolean().optional(),
});

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateLimitResult = await rateLimit(ip, "approval-request", 3, 300);
    if (!rateLimitResult.success) {
      return errorResponse("تعداد درخواست‌های بیش از حد", 429);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message || "داده نامعتبر", 400);
    }

    const { twoFactorSessionId, deviceId, identifier, trustScore, trustLevel, lostRecoveryCode } =
      parsed.data;
    const userAgent = getUserAgent(req);

    await connectDB();
    const twoFactor = await TwoFactorAuth.findOne({ sessionId: twoFactorSessionId });
    if (!twoFactor) {
      return errorResponse("جلسه تأیید معتبر نیست", 400);
    }

    const otpDone =
      (twoFactor.emailOtpId ? twoFactor.steps.emailVerified : true) &&
      (twoFactor.phoneOtpId ? twoFactor.steps.phoneVerified : true);

    if (!otpDone) {
      return errorResponse("ابتدا کد OTP را تأیید کنید", 400);
    }

    const isLowTrust = (trustLevel || twoFactor.trustLevel) === "LOW";
    if (!isLowTrust && !twoFactor.canRequestAdminApproval) {
      return errorResponse("درخواست تأیید ادمین برای این سطح اعتماد مجاز نیست", 403);
    }

    const result = await createLowTrustApprovalRequest({
      userId: twoFactor.userId,
      deviceId,
      identifier,
      twoFactorSessionId,
      trustScore: trustScore ?? 0,
      trustLevel: trustLevel || twoFactor.trustLevel || "LOW",
      lostRecoveryCode: lostRecoveryCode ?? twoFactor.requiresRecoveryCode,
      requestMeta: { ip, userAgent },
    });

    return successResponse(
      result.alreadyPending
        ? "درخواست قبلی شما هنوز در انتظار است"
        : "درخواست تأیید ادمین ثبت شد",
      {
        requestId: result.requestId,
        approvalToken: result.approvalToken,
        status: result.status,
        expiresAt: result.expiresAt,
      }
    );
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
