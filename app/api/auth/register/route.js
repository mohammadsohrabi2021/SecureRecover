import { registerSchema } from "@/lib/utils/validators";
import { registerUser } from "@/services/auth.service";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { rateLimit } from "@/lib/rate-limit";
import { makeFirstUserAdmin } from "@/services/admin.service";

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    const rateLimitResult = await rateLimit(ip, "register", 3, 3600);
    if (!rateLimitResult.success) {
      return errorResponse("تعداد درخواست‌های ثبت نام بیش از حد. لطفاً بعداً تلاش کنید.", 429);
    }
    
    const body = await req.json().catch(() => ({}));
    
    const validation = registerSchema.safeParse(body);
    
    if (!validation.success) {
      return errorResponse(
        "اطلاعات وارد شده معتبر نیست",
        422,
        validation.error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message
        }))
      );
    }
    
    const userAgent = req.headers.get("user-agent") || "unknown";
    const requestMeta = { ip, userAgent };
    
    const user = await registerUser(validation.data, requestMeta);
    await makeFirstUserAdmin();
    return successResponse("ثبت نام با موفقیت انجام شد", { 
      user,
      redirectTo: "/login"
    }, 201);
    
  } catch (error) {
    const status = error.message.includes("قبلاً") ? 409 : 500;
    return errorResponse(error.message, status);
  }
}