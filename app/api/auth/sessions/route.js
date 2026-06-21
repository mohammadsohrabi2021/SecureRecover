// app/api/auth/sessions/route.js
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import connectDB from "@/lib/db";
import Session from "@/models/Session";
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
    
    await connectDB();
    
    const sessions = await Session.find({
      userId: decoded.userId,
      isValid: true
    }).sort({ lastActive: -1 });
    
    return successResponse("لیست جلسات فعال", { sessions });
    
  } catch (error) {
    console.error("GET sessions error:", error);
    return errorResponse(error.message, 500);
  }
}