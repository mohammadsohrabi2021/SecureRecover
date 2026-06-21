import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { generateUserRecoveryCodes } from "@/services/recovery.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(req) {
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
    
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";
    
    const recoveryCodes = await generateUserRecoveryCodes(decoded.userId, { ip, userAgent });
    
    return successResponse("کدهای بازیابی جدید تولید شد", { recoveryCodes });
    
  } catch (error) {
    console.error("Generate recovery codes error:", error);
    return errorResponse(error.message, 500);
  }
}