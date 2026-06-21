// app/api/auth/me/route.js
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { getCurrentUserById, validateSession } from "@/services/auth.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("secure_recover_session")?.value;
    
    if (!token) {
      return errorResponse("احراز هویت نشده", 401);
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId || !decoded.sessionId) {
      return errorResponse("توکن نامعتبر است", 401);
    }
    
    // ✅ بررسی اعتبار سشن در دیتابیس
    const isValidSession = await validateSession(decoded.sessionId, decoded.userId);
    
    if (!isValidSession) {
      // سشن معتبر نیست - کوکی را پاک کن
      const response = errorResponse("جلسه شما منقضی شده است", 401);
      response.cookies.delete("secure_recover_session");
      return response;
    }
    
    const user = await getCurrentUserById(decoded.userId);
    
    if (!user) {
      return errorResponse("کاربر یافت نشد", 404);
    }
    
    return successResponse("اطلاعات کاربر", { user });
    
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return errorResponse(error.message || "خطا در دریافت اطلاعات کاربر", 500);
  }
}