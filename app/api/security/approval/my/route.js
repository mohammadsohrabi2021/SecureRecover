import { authenticateRequest } from "@/middleware/auth";
import { getUserApprovalRequests } from "@/services/approval.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;

    const requests = await getUserApprovalRequests(auth.userId);
    return successResponse("درخواست‌های تأیید کاربر", { requests });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
