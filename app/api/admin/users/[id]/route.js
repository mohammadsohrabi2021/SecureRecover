import { requireAdmin } from "@/middleware/adminAuth";
import { toggleUserStatus } from "@/services/admin.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function PUT(req, { params }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;
    const { isActive } = await req.json();

    if (typeof isActive !== "boolean") {
      return errorResponse("وضعیت کاربر باید true یا false باشد", 400);
    }

    const user = await toggleUserStatus(auth.userId, id, isActive);

    return successResponse(
      isActive ? "کاربر فعال شد" : "کاربر غیرفعال شد",
      { user: { id: user._id, name: user.name, email: user.email, isActive: user.isActive } }
    );
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
