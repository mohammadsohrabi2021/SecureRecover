import { requireAdmin } from "@/middleware/adminAuth";
import { getAdminSecurityLogs } from "@/services/admin.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 30);
    const action = searchParams.get("action") || undefined;
    const status = searchParams.get("status") || undefined;

    const data = await getAdminSecurityLogs({ page, limit, action, status });
    return successResponse("لاگ‌های امنیتی", data);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
