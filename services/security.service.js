import connectDB from "@/lib/db";
import SecurityLog from "@/models/SecurityLog";

export async function logSecurityEvent({
  userId = null,
  event,
  status = "success",
  request,
  details = {},
}) {
  await connectDB();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const userAgent = request.headers.get("user-agent") || "Unknown";

  return SecurityLog.create({
    userId,
    event,
    status,
    ip,
    userAgent,
    details,
  });
}

export async function getUserSecurityLogs(userId) {
  await connectDB();
  return SecurityLog.find({ userId }).sort({ createdAt: -1 }).limit(50);
}
