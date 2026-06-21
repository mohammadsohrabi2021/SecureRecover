// app/api/recovery/status/route.js
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { getUserRecoveryCodesStatus } from "@/services/recovery.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("secure_recover_session")?.value;
    
    if (!token) {
      return errorResponse("احراز هویت نشده", 401);
    }
    
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return errorResponse("توکن نامعتبر است", 401);
    }
    
    const status = await getUserRecoveryCodesStatus(decoded.userId);
    
    return successResponse("وضعیت کدهای بازیابی", status);
    
  } catch (error) {
    console.error("GET recovery status error:", error);
    return errorResponse(error.message, 500);
  }
}