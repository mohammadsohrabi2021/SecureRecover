// app/api/auth/sessions/revoke-all/route.js
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import connectDB from "@/lib/db";
import Session from "@/models/Session";
import SecurityLog from "@/models/SecurityLog";
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
    
    await connectDB();
    
    const result = await Session.updateMany(
      {
        userId: decoded.userId,
        sessionId: { $ne: decoded.sessionId },
        isValid: true
      },
      { isValid: false }
    );
    
    await SecurityLog.create({
      userId: decoded.userId,
      action: "ALL_SESSIONS_REVOKED",
      status: "success",
      details: { revokedCount: result.modifiedCount }
    });
    
    return successResponse(`${result.modifiedCount} جلسه با موفقیت بسته شد`);
    
  } catch (error) {
    console.error("Revoke all sessions error:", error);
    return errorResponse(error.message, 500);
  }
}