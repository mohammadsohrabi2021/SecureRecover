import { requireAdmin } from "@/middleware/adminAuth";
import { getAdminApprovals } from "@/services/admin.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";

    const approvals = await getAdminApprovals(status === "all" ? "all" : status);

    return successResponse("درخواست‌های تأیید", { approvals });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
