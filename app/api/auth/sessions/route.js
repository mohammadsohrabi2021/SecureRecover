import connectDB from "@/lib/db";
import Session from "@/models/Session";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req) {

  try {

    await connectDB();

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return errorResponse("احراز هویت انجام نشده است", 401);
    }

    const payload = verifyToken(token);

    const sessions = await Session.find({
      userId: payload.userId
    }).sort({ createdAt: -1 });

    const formatted = sessions.map((session) => ({
      ...session.toObject(),
      isCurrent: session.token === token
    }));

    return successResponse("نشست‌ها دریافت شدند", formatted);

  } catch (error) {

    return errorResponse("دسترسی غیرمجاز", 401);

  }

}
