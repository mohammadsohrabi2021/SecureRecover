import { authenticateRequest } from "@/middleware/auth";
import { getUserSecurityLogs } from "@/services/security.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;

    const logs = await getUserSecurityLogs(auth.userId);
    return successResponse("لیست وقایع امنیتی دریافت شد", { logs });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
