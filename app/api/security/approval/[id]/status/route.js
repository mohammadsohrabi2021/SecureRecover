import { getApprovalStatus } from "@/services/approval.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return errorResponse("توکن درخواست الزامی است", 400);
    }

    const status = await getApprovalStatus(id, token);
    return successResponse("وضعیت درخواست", status);
  } catch (error) {
    return errorResponse(error.message, 401);
  }
}
