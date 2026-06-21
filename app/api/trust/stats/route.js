import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import trustScoreService from "@/services/trustScore.service";
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
    
    const statistics = await trustScoreService.getTrustStatistics(decoded.userId);
    
    return successResponse("آمار اعتماد", { statistics });
    
  } catch (error) {
    console.error("Trust statistics error:", error);
    return errorResponse(error.message, 500);
  }
}