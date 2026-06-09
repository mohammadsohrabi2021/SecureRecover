// app/api/auth/me/route.js
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { getCurrentUserById } from "@/services/auth.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req) {
  try {
    // ✅ در Next.js 15 به بعد، باید از await استفاده کنید
    const cookieStore = await cookies();
    const token = cookieStore.get("secure_recover_session")?.value;
    
    if (!token) {
      return errorResponse("احراز هویت نشده", 401);
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return errorResponse("توکن نامعتبر است", 401);
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