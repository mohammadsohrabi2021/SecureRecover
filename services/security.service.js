import connectDB from "@/lib/db";
import SecurityLog from "@/models/SecurityLog";

export async function logSecurityEvent({ userId, action, status, request, details = {}, deviceId = null }) {
  try {
    await connectDB();

    const ip = request?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = request?.headers?.get?.("user-agent") || "unknown";

    return await SecurityLog.create({
      userId: userId || null,
      action,
      status: status || "success",
      ip,
      userAgent,
      deviceId,
      details,
    });
  } catch (error) {
    console.error("Error logging security event:", error);
    return null;
  }
}

export async function getUserSecurityLogs(userId, limit = 50) {
  await connectDB();

  return SecurityLog.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("-__v")
    .lean();
}

export async function getRecentFailedLogins(userId, hours = 24) {
  await connectDB();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return SecurityLog.countDocuments({
    userId,
    action: { $in: ["LOGIN_ATTEMPT_FAILED", "LOGIN_BLOCKED", "OTP_MAX_ATTEMPTS"] },
    status: "failed",
    createdAt: { $gte: since },
  });
}
