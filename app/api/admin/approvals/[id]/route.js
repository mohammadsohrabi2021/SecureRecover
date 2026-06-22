import { requireAdmin } from "@/middleware/adminAuth";
import { reviewApprovalWithToken } from "@/services/approval.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(req, { params }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;
    const { action, adminNote } = await req.json();

    const validActions = ["approve", "deny", "reject", "block"];
    if (!validActions.includes(action)) {
      return errorResponse("عملیات نامعتبر", 400);
    }

    const normalizedAction =
      action === "reject" ? "deny" : action;

    const approval = await reviewApprovalWithToken(
      id,
      auth.userId,
      normalizedAction,
      adminNote
    );

    const messages = {
      approve: "درخواست تأیید شد — کاربر می‌تواند ورود را تکمیل کند",
      deny: "درخواست رد شد",
      block: "درخواست رد و حساب موقتاً مسدود شد",
    };

    return successResponse(messages[normalizedAction] || "عملیات انجام شد", {
      approval: {
        _id: approval._id,
        status: approval.status,
        reviewedAt: approval.reviewedAt,
      },
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
