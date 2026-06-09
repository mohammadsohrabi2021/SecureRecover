import { verifyToken } from "@/lib/jwt";
import { getUserSecurityLogs } from "@/services/security.service";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { COOKIE_NAME } from "@/lib/cookies";

export async function GET(req) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const decoded = verifyToken(token);
    
    if (!decoded) return errorResponse("غیرمجاز", 401);

    const logs = await getUserSecurityLogs(decoded.userId);
    return successResponse("لیست وقایع امنیتی دریافت شد", { logs });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
