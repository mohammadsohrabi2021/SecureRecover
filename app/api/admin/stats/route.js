import { requireAdmin } from "@/middleware/adminAuth";
import { getAdminDashboardStats } from "@/services/admin.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const stats = await getAdminDashboardStats();
    return successResponse("آمار داشبورد", { stats });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
