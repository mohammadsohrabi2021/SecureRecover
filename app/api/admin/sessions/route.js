import { requireAdmin } from "@/middleware/adminAuth";
import { getAdminSessions, revokeAdminSession } from "@/services/admin.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);

    const data = await getAdminSessions({ page, limit });
    return successResponse("لیست جلسات", data);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(req) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { sessionId } = await req.json();
    if (!sessionId) return errorResponse("sessionId الزامی است", 400);

    await revokeAdminSession(sessionId, auth.userId);
    return successResponse("جلسه بسته شد");
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
