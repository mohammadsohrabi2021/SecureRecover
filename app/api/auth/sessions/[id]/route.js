// app/api/auth/sessions/[id]/route.js
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import connectDB from "@/lib/db";
import Session from "@/models/Session";
import SecurityLog from "@/models/SecurityLog";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function DELETE(req, { params }) {
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
    
    const { id } = await params;
    
    await connectDB();
    
    // ✅ پیدا کردن سشن
    const session = await Session.findOne({
      sessionId: id,
      userId: decoded.userId
    });
    
    if (!session) {
      return errorResponse("جلسه یافت نشد", 404);
    }
    
    // ✅ غیرفعال کردن سشن
    session.isValid = false;
    await session.save();
    
    await SecurityLog.create({
      userId: decoded.userId,
      action: "SESSION_REVOKED",
      status: "success",
      details: { 
        sessionId: id,
        deviceName: session.deviceName,
        ip: session.ip
      }
    });
    
    console.log(`✅ Session ${id} revoked for user ${decoded.userId}`);
    
    return successResponse("جلسه با موفقیت بسته شد");
    
  } catch (error) {
    console.error("DELETE session error:", error);
    return errorResponse(error.message, 500);
  }
}