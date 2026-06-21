import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import trustScoreService from "@/services/trustScore.service";
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
    
    const body = await req.json();
    const { deviceId, deviceInfo, isSuccessful, usedOTP, usedBackupCode, noOTPNeeded } = body;
    
    await trustScoreService.updateTrustScore(decoded.userId, {
      isSuccessful: isSuccessful !== false,
      deviceId,
      deviceInfo,
      usedOTP: usedOTP || false,
      usedBackupCode: usedBackupCode || false,
      noOTPNeeded: noOTPNeeded || false
    });
    
    return successResponse("الگوی ورود ثبت شد", { success: true });
    
  } catch (error) {
    console.error("Record pattern error:", error);
    return errorResponse(error.message, 500);
  }
}