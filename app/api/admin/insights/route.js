import { requireAdmin } from "@/middleware/adminAuth";
import { getAdminInsights } from "@/services/admin.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const insights = await getAdminInsights();
    return successResponse("بینش‌های امنیتی", { insights });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
