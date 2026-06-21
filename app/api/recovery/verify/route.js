import { useRecoveryCode } from "@/services/recovery.service";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { rateLimit } from "@/lib/rate-limit";
import User from "@/models/User";
import connectDB from "@/lib/db";
import { generateDeviceId } from "@/lib/hash";

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    const rateLimitResult = await rateLimit(ip, "recovery-verify", 5, 300);
    if (!rateLimitResult.success) {
      return errorResponse("تعداد تلاش‌های بیش از حد. لطفاً بعداً تلاش کنید.", 429);
    }
    
    const body = await req.json().catch(() => ({}));
    const { identifier, code, deviceId } = body;
    
    if (!identifier || !code) {
      return errorResponse("ایمیل/شماره تلفن و کد بازیابی الزامی است", 400);
    }
    
    await connectDB();
    
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });
    
    if (!user) {
      return errorResponse("کاربر یافت نشد", 404);
    }
    
    const userAgent = req.headers.get("user-agent") || "unknown";
    const finalDeviceId = deviceId || generateDeviceId();
    
    await useRecoveryCode(user._id, code, { ip, userAgent, deviceId: finalDeviceId });
    
    return successResponse("کد بازیابی تأیید شد. لطفاً وارد شوید.", {
      recoveryVerified: true,
      deviceId: finalDeviceId
    });
    
  } catch (error) {
    console.error("Recovery verify error:", error);
    return errorResponse(error.message, 400);
  }
}