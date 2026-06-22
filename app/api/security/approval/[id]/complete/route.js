import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, getUserAgent } from "@/lib/request";
import { completeApprovedLogin } from "@/services/approval.service";
import { jsonWithAuthCookie } from "@/lib/cookies";
import { errorResponse } from "@/lib/utils/response";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(16),
});

export async function POST(req, { params }) {
  try {
    const ip = getClientIp(req);
    const rateLimitResult = await rateLimit(ip, "approval-complete", 5, 60);
    if (!rateLimitResult.success) {
      return errorResponse("تعداد تلاش‌های بیش از حد", 429);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("توکن نامعتبر", 400);
    }

    const result = await completeApprovedLogin(id, parsed.data.token, {
      ip,
      userAgent: getUserAgent(req),
    });

    return jsonWithAuthCookie(
      "ورود با تأیید ادمین موفق بود",
      { user: result.user },
      result.token
    );
  } catch (error) {
    return errorResponse(error.message, 401);
  }
}
