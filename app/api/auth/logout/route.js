import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { logout } from "@/services/auth.service";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { clearAuthCookie } from "@/lib/cookies";

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("secure_recover_session")?.value;
    
    if (!token) {
      return errorResponse("احراز هویت نشده", 401);
    }
    
    const decoded = verifyToken(token);
    
    if (decoded && decoded.sessionId) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
      const userAgent = req.headers.get("user-agent") || "unknown";
      
      await logout(decoded.sessionId, { ip, userAgent });
    }
    
    const res = successResponse("خروج موفقیت‌آمیز بود");
    res.headers.set("Set-Cookie", clearAuthCookie());
    
    return res;
    
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    return errorResponse(error.message || "خطا در خروج", 500);
  }
}