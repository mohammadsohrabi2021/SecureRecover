import { verifyToken } from "@/lib/jwt";
import Session from "@/models/Session";
import connectDB from "@/lib/db";

export async function getAuthUser(token) {
  const payload = verifyToken(token);
  if (!payload?.userId || !payload?.sessionId) return null;

  await connectDB();

  const session = await Session.findOne({
    sessionId: payload.sessionId,
    userId: payload.userId,
    isValid: true,
    expiresAt: { $gt: new Date() },
  });

  if (!session) return null;

  return payload;
}
