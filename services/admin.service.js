import connectDB from "@/lib/db";
import User from "@/models/User";
import Session from "@/models/Session";
import AdminApproval from "@/models/AdminApproval";
import { sanitizeApprovalsForAdmin } from "@/lib/sanitizeApproval";
import SecurityLog from "@/models/SecurityLog";
import TrustScore from "@/models/TrustScore";
import TrustedDevice from "@/models/TrustedDevice";
import RecoveryCode from "@/models/RecoveryCode";
import TrustEvent from "@/models/TrustEvent";
import { signToken } from "@/lib/jwt";
import { generateSessionId } from "@/lib/hash";
import { resolveTrustLevel } from "@/types/trust";

export async function makeFirstUserAdmin() {
  await connectDB();
  const adminExists = await User.findOne({ $or: [{ isAdmin: true }, { role: { $in: ["admin", "super_admin"] } }] });
  if (adminExists) return;
  const firstUser = await User.findOne().sort({ createdAt: 1 });
  if (firstUser) {
    firstUser.isAdmin = true;
    firstUser.role = "super_admin";
    await firstUser.save();
  }
}

export async function createAdminApproval(userId, deviceId, identifier, trustScore, requestMeta = {}) {
  await connectDB();
  const approval = await AdminApproval.create({
    userId,
    sessionId: generateSessionId(),
    deviceId,
    identifier,
    trustScore,
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    location: requestMeta.location,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  await SecurityLog.create({
    userId,
    action: "ADMIN_APPROVAL_REQUESTED",
    status: "pending",
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    deviceId,
    details: { trustScore, requestId: approval._id },
  });

  return approval;
}

export async function reviewApproval(approvalId, adminUserId, action, adminNote = "") {
  const { reviewApprovalWithToken } = await import("@/services/approval.service");
  const normalizedAction = action === "reject" ? "deny" : action;
  return reviewApprovalWithToken(approvalId, adminUserId, normalizedAction, adminNote);
}

export async function getAdminDashboardStats() {
  await connectDB();

  const [
    totalUsers,
    activeUsers,
    adminUsers,
    pendingApprovals,
    activeSessions,
    failedLogins24h,
    lowTrustUsers,
    suspiciousEvents,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isAdmin: true }),
    AdminApproval.countDocuments({ status: "pending" }),
    Session.countDocuments({ isValid: true, expiresAt: { $gt: new Date() } }),
    SecurityLog.countDocuments({
      status: "failed",
      action: { $in: ["LOGIN_BLOCKED", "LOGIN_ATTEMPT_FAILED", "OTP_MAX_ATTEMPTS", "RECOVERY_FAILED"] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
    TrustScore.countDocuments({ currentScore: { $lt: 30 } }),
    TrustScore.aggregate([
      { $unwind: "$unusualPatterns" },
      { $match: { "unusualPatterns.resolved": false } },
      { $count: "count" },
    ]).then((r) => r[0]?.count || 0),
  ]);

  return {
    totalUsers,
    activeUsers,
    adminUsers,
    pendingApprovals,
    activeSessions,
    failedLogins24h,
    lowTrustUsers,
    suspiciousEvents,
  };
}

export async function getAdminUsers({ search = "", page = 1, limit = 20 } = {}) {
  await connectDB();
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(query).select("-__v").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ]);

  const userIds = users.map((u) => u._id);
  const trustScores = await TrustScore.find({ userId: { $in: userIds } }).lean();
  const trustMap = Object.fromEntries(trustScores.map((t) => [t.userId.toString(), t]));

  return {
    users: users.map((u) => ({
      ...u,
      trustScore: trustMap[u._id.toString()]?.currentScore ?? 50,
      trustLevel: resolveTrustLevel(trustMap[u._id.toString()]?.currentScore ?? 50).level,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function toggleUserStatus(adminUserId, targetUserId, isActive) {
  await connectDB();
  const user = await User.findById(targetUserId);
  if (!user) throw new Error("کاربر یافت نشد");
  if (user._id.toString() === adminUserId && !isActive) {
    throw new Error("نمی‌توانید خودتان را غیرفعال کنید");
  }

  user.isActive = isActive;
  await user.save();

  await SecurityLog.create({
    userId: targetUserId,
    action: isActive ? "ACCOUNT_UNLOCKED" : "ACCOUNT_LOCKED",
    status: "success",
    details: { adminId: adminUserId },
  });

  return user;
}

export async function getAdminSessions({ page = 1, limit = 20 } = {}) {
  await connectDB();
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    Session.find({ isValid: true, expiresAt: { $gt: new Date() } })
      .populate("userId", "name email")
      .sort({ lastActive: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Session.countDocuments({ isValid: true, expiresAt: { $gt: new Date() } }),
  ]);

  return { sessions, total, page, pages: Math.ceil(total / limit) };
}

export async function revokeAdminSession(sessionId, adminUserId) {
  await connectDB();
  const session = await Session.findOne({ sessionId });
  if (!session) throw new Error("جلسه یافت نشد");

  session.isValid = false;
  await session.save();

  await SecurityLog.create({
    userId: session.userId,
    action: "SESSION_REVOKED",
    status: "success",
    details: { adminId: adminUserId, sessionId },
  });

  return true;
}

export async function getAdminTrustScores({ page = 1, limit = 20, minScore, maxScore } = {}) {
  await connectDB();
  const filter = {};
  if (minScore != null) filter.currentScore = { ...filter.currentScore, $gte: Number(minScore) };
  if (maxScore != null) filter.currentScore = { ...filter.currentScore, $lte: Number(maxScore) };

  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    TrustScore.find(filter)
      .populate("userId", "name email phone")
      .sort({ currentScore: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TrustScore.countDocuments(filter),
  ]);

  return {
    records: records.map((r) => ({
      ...r,
      level: resolveTrustLevel(r.currentScore).level,
      unusualCount: r.unusualPatterns?.filter((p) => !p.resolved).length || 0,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function getAdminSecurityLogs({ page = 1, limit = 30, action, status } = {}) {
  await connectDB();
  const filter = {};
  if (action) filter.action = action;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    SecurityLog.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SecurityLog.countDocuments(filter),
  ]);

  return { logs, total, page, pages: Math.ceil(total / limit) };
}

export async function getAdminInsights() {
  await connectDB();

  const [
    totalTrustedDevices,
    totalRecoveryCodes,
    usedRecoveryCodes,
    recentTrustEvents,
    pendingApprovals,
  ] = await Promise.all([
    TrustedDevice.countDocuments({ isActive: true }),
    RecoveryCode.countDocuments(),
    RecoveryCode.countDocuments({ used: true }),
    TrustEvent.find().sort({ createdAt: -1 }).limit(10).populate("userId", "name email").lean(),
    AdminApproval.find({ status: "pending" }).populate("userId", "name email").limit(5).lean(),
  ]);

  const topRiskUsers = await TrustScore.find({ currentScore: { $lt: 30 } })
    .populate("userId", "name email")
    .sort({ currentScore: 1 })
    .limit(5)
    .lean();

  return {
    devices: { total: totalTrustedDevices },
    recovery: {
      total: totalRecoveryCodes,
      used: usedRecoveryCodes,
      available: totalRecoveryCodes - usedRecoveryCodes,
    },
    recentTrustEvents,
    pendingApprovals,
    topRiskUsers: topRiskUsers.map((r) => ({
      ...r,
      level: resolveTrustLevel(r.currentScore).level,
    })),
  };
}

export async function getPendingApprovals() {
  return getAdminApprovals("pending");
}

export async function getAdminApprovals(status = "pending") {
  await connectDB();
  const filter = status === "all" ? {} : { status };
  const approvals = await AdminApproval.find(filter)
    .populate("userId", "name email phone")
    .populate("reviewedBy", "name email")
    .select("-approvalTokenHash")
    .sort({ requestedAt: -1 })
    .lean();
  return sanitizeApprovalsForAdmin(approvals);
}
