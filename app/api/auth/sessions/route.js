import { authenticateRequest } from "@/middleware/auth";
import connectDB from "@/lib/db";
import Session from "@/models/Session";
import SecurityLog from "@/models/SecurityLog";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;

    await connectDB();

    const sessions = await Session.find({
      userId: auth.userId,
      isValid: true,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastActive: -1 })
      .lean();

    const mapped = sessions.map((s) => ({
      ...s,
      isCurrent: s.sessionId === auth.sessionId,
    }));

    return successResponse("لیست جلسات فعال", { sessions: mapped, currentSessionId: auth.sessionId });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
