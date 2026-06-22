import connectDB from "@/lib/db";
import AdminApproval from "@/models/AdminApproval";
import RecoveryCode from "@/models/RecoveryCode";
import TwoFactorAuth from "@/models/TwoFactorAuth";
import User from "@/models/User";
import SecurityLog from "@/models/SecurityLog";
import Session from "@/models/Session";
import { hashValue, compareValue, generateSecureCode } from "@/lib/hash";
import { signToken } from "@/lib/jwt";
import { generateSessionId } from "@/lib/hash";
import { completeLogin } from "@/services/login.service";
import { TRUST_LEVELS } from "@/types/trust";
import { sanitizeApprovalsForUser } from "@/lib/sanitizeApproval";

export async function userHasRecoveryCodes(userId) {
  await connectDB();
  const count = await RecoveryCode.countDocuments({
    userId,
    used: false,
    expiresAt: { $gt: new Date() },
  });
  return count > 0;
}

/**
 * Create an admin approval ticket for low-trust login attempts.
 * Stores risk factors, device info, and trust context for admin review.
 */
export async function createLowTrustApprovalRequest({
  userId,
  deviceId,
  identifier,
  twoFactorSessionId,
  trustScore,
  trustLevel,
  riskFactors = [],
  lostRecoveryCode = false,
  requestMeta = {},
}) {
  await connectDB();

  const defaultRisk = lostRecoveryCode
    ? ["LOW_TRUST", "LOST_RECOVERY_CODE"]
    : ["LOW_TRUST", "NO_RECOVERY_CODE"];

  const existing = await AdminApproval.findOne({
    userId,
    deviceId,
    status: "pending",
    expiresAt: { $gt: new Date() },
  });

  const rawToken = generateSecureCode(32, "hex");
  const approvalTokenHash = await hashValue(rawToken);

  if (existing) {
    existing.approvalTokenHash = approvalTokenHash;
    existing.approvalTokenUsed = false;
    existing.riskFactors = riskFactors.length ? riskFactors : defaultRisk;
    existing.requestContext = {
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      location: requestMeta.location,
      trustScore,
      trustLevel: trustLevel || TRUST_LEVELS.LOW,
      lostRecoveryCode,
    };
    await existing.save();

    return {
      requestId: existing._id,
      approvalToken: rawToken,
      status: existing.status,
      expiresAt: existing.expiresAt,
      alreadyPending: true,
    };
  }

  const approval = await AdminApproval.create({
    userId,
    sessionId: generateSessionId(),
    deviceId,
    identifier,
    twoFactorSessionId,
    status: "pending",
    type: lostRecoveryCode ? "low_trust_login" : "admin_approval",
    trustScore,
    trustLevel: trustLevel || TRUST_LEVELS.LOW,
    riskFactors: riskFactors.length ? riskFactors : defaultRisk,
    approvalTokenHash,
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    location: requestMeta.location,
    requestContext: {
      ip: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      location: requestMeta.location,
      trustScore,
      trustLevel: trustLevel || TRUST_LEVELS.LOW,
      lostRecoveryCode,
    },
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  await SecurityLog.create({
    userId,
    action: "ADMIN_APPROVAL_REQUESTED",
    status: "pending",
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    deviceId,
    details: {
      requestId: approval._id,
      type: "low_trust_login",
      trustScore,
      trustLevel,
    },
  });

  return {
    requestId: approval._id,
    approvalToken: rawToken,
    status: "pending",
    expiresAt: approval.expiresAt,
    alreadyPending: false,
  };
}

export async function getApprovalStatus(requestId, rawToken) {
  await connectDB();

  const approval = await AdminApproval.findById(requestId).populate("userId", "name email");
  if (!approval) throw new Error("درخواست یافت نشد");

  if (!rawToken || !(await compareValue(rawToken, approval.approvalTokenHash))) {
    throw new Error("دسترسی به درخواست مجاز نیست");
  }

  if (approval.status === "pending" && approval.expiresAt < new Date()) {
    approval.status = "expired";
    await approval.save();
  }

  return {
    requestId: approval._id,
    status: approval.status,
    trustScore: approval.trustScore,
    trustLevel: approval.trustLevel,
    expiresAt: approval.expiresAt,
    reviewedAt: approval.reviewedAt,
    adminNote: approval.adminNote,
    user: approval.userId
      ? { name: approval.userId.name, email: approval.userId.email }
      : null,
  };
}

export async function completeApprovedLogin(requestId, rawToken, requestMeta = {}) {
  await connectDB();

  const approval = await AdminApproval.findById(requestId);
  if (!approval) throw new Error("درخواست یافت نشد");

  if (!rawToken || !(await compareValue(rawToken, approval.approvalTokenHash))) {
    throw new Error("توکن تأیید نامعتبر است");
  }

  if (approval.status !== "approved") {
    if (approval.status === "denied") throw new Error("درخواست توسط ادمین رد شد");
    if (approval.status === "expired") throw new Error("درخواست منقضی شده است");
    throw new Error("درخواست هنوز تأیید نشده است");
  }

  if (approval.approvalTokenUsed) {
    throw new Error("توکن تأیید قبلاً استفاده شده است");
  }

  if (approval.expiresAt < new Date()) {
    approval.status = "expired";
    await approval.save();
    throw new Error("درخواست منقضی شده است");
  }

  approval.approvalTokenUsed = true;
  await approval.save();

  const result = await completeLogin(approval.userId, approval.deviceId, {
    ...requestMeta,
    usedOTP: true,
    usedBackupCode: false,
    adminApproved: true,
  });

  await SecurityLog.create({
    userId: approval.userId,
    action: "ADMIN_APPROVED_LOGIN_COMPLETED",
    status: "success",
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    deviceId: approval.deviceId,
    details: { requestId: approval._id },
  });

  return result;
}

export async function reviewApprovalWithToken(approvalId, adminUserId, action, adminNote = "") {
  await connectDB();

  const admin = await User.findById(adminUserId);
  if (!admin?.isAdmin && !["admin", "super_admin"].includes(admin?.role)) {
    throw new Error("دسترسی غیرمجاز");
  }

  const approval = await AdminApproval.findById(approvalId);
  if (!approval) throw new Error("درخواست یافت نشد");
  if (approval.status !== "pending") throw new Error("این درخواست قبلاً بررسی شده است");

  if (approval.expiresAt < new Date()) {
    approval.status = "expired";
    await approval.save();
    throw new Error("درخواست منقضی شده است");
  }

  if (action === "approve") {
    approval.status = "approved";
  } else if (action === "deny" || action === "reject") {
    approval.status = "denied";
  } else if (action === "block") {
    approval.status = "blocked";
    const user = await User.findById(approval.userId);
    if (user) {
      user.isActive = false;
      await user.save();
    }
  } else {
    throw new Error("عملیات نامعتبر");
  }

  approval.reviewedAt = new Date();
  approval.reviewedBy = adminUserId;
  approval.adminNote = adminNote || "";
  await approval.save();

  await SecurityLog.create({
    userId: approval.userId,
    action: action === "approve" ? "ADMIN_APPROVED_LOGIN" : "ADMIN_REJECTED_LOGIN",
    status: action === "approve" ? "success" : "failed",
    details: { adminId: adminUserId, requestId: approval._id, action, adminNote },
  });

  return approval;
}

export async function getUserApprovalRequests(userId, limit = 20) {
  await connectDB();

  const requests = await AdminApproval.find({ userId })
    .select(
      "-approvalTokenHash -approvalTokenUsed -twoFactorSessionId -sessionId -deviceId -ip -userAgent -requestContext -reviewedBy -identifier"
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return sanitizeApprovalsForUser(requests);
}
