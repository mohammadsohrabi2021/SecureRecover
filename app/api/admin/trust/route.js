import { requireAdmin } from "@/middleware/adminAuth";
import { getAdminTrustScores } from "@/services/admin.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const minScore = searchParams.get("minScore");
    const maxScore = searchParams.get("maxScore");

    const data = await getAdminTrustScores({
      page,
      limit,
      minScore: minScore != null ? Number(minScore) : undefined,
      maxScore: maxScore != null ? Number(maxScore) : undefined,
    });

    return successResponse("امتیازهای اعتماد", data);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
