/** Strip sensitive fields from AdminApproval before API responses. */

export function sanitizeApprovalForAdmin(approval) {
  if (!approval) return null;
  const { approvalTokenHash, ...safe } = approval;
  return safe;
}

export function sanitizeApprovalForUser(approval) {
  if (!approval) return null;
  const {
    approvalTokenHash,
    approvalTokenUsed,
    twoFactorSessionId,
    sessionId,
    deviceId,
    ip,
    userAgent,
    requestContext,
    reviewedBy,
    identifier,
    ...safe
  } = approval;
  return safe;
}

export function sanitizeApprovalsForAdmin(list = []) {
  return list.map(sanitizeApprovalForAdmin);
}

export function sanitizeApprovalsForUser(list = []) {
  return list.map(sanitizeApprovalForUser);
}
