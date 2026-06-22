import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, getUserAgent } from "@/lib/request";
import { completeLogin } from "@/services/login.service";
import { useRecoveryCode } from "@/services/recovery.service";
import User from "@/models/User";
import connectDB from "@/lib/db";
import { jsonWithAuthCookie } from "@/lib/cookies";
import { errorResponse } from "@/lib/utils/response";
import { z } from "zod";

const schema = z.object({
  identifier: z.string().min(1),
  code: z.string().length(8).regex(/^[A-Za-z0-9]+$/),
  deviceId: z.string().optional(),
});

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    const rateLimitResult = await rateLimit(ip, "recovery-login", 5, 60);
    if (!rateLimitResult.success) {
      return errorResponse("تعداد تلاش‌های بیش از حد", 429);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message || "داده نامعتبر", 400);
    }

    const { identifier, code, deviceId } = parsed.data;
    await connectDB();

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    });

    if (!user || !user.isActive) {
      return errorResponse("کاربر یافت نشد یا غیرفعال است", 404);
    }

    const requestMeta = { ip, userAgent, deviceId };

    await useRecoveryCode(user._id, code.toUpperCase(), requestMeta);

    const result = await completeLogin(user._id, deviceId || "recovery-device", {
      ...requestMeta,
      usedBackupCode: true,
    });

    return jsonWithAuthCookie("ورود با کد بازیابی موفق بود", { user: result.user }, result.token);
  } catch (error) {
    return errorResponse(error.message || "خطا در ورود با کد بازیابی", 401);
  }
}
