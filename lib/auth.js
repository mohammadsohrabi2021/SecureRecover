import { verifyToken } from "@/lib/jwt";
import Session from "@/models/Session";
import connectDB from "@/lib/db";

export async function getAuthUser(token) {

  const payload = verifyToken(token);

  if (!payload) return null;

  await connectDB();

  const session = await Session.findOne({
    token,
    isValid: true
  });

  if (!session) return null;

  return payload;
}
