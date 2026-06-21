// app/api/auth/resend-2fa/route.js
import twoFactorService from "@/services/twoFactor.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(req) {
  try {
    const body = await req.json();
    const { sessionId, type } = body;
    
    if (!sessionId || !type) {
      return errorResponse("اطلاعات ناقص است", 400);
    }
    
    const twoFactorSession = await twoFactorService.get2FASession(sessionId);
    if (!twoFactorSession) {
      return errorResponse("جلسه معتبر نیست", 400);
    }
    
    const user = await User.findById(twoFactorSession.userId);
    
    if (type === "email") {
      await twoFactorService.sendEmailCode(user.email, sessionId);
    } else if (type === "phone") {
      await twoFactorService.sendPhoneCode(user.phone, sessionId);
    } else {
      return errorResponse("نوع نامعتبر است", 400);
    }
    
    return successResponse("کد جدید ارسال شد", { type });
    
  } catch (error) {
    console.error("Resend 2FA error:", error);
    return errorResponse(error.message, 500);
  }
}