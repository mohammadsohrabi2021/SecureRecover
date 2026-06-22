import { requireAdmin } from "@/middleware/adminAuth";
import { getAdminUsers } from "@/services/admin.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);

    const data = await getAdminUsers({ search, page, limit });
    return successResponse("لیست کاربران", data);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
