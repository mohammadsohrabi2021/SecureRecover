import { verifyToken } from "@/lib/jwt";
import { generateUserRecoveryCodes } from "@/services/recovery.service";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { COOKIE_NAME } from "@/lib/cookies";

export async function POST(req) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const decoded = verifyToken(token);
    
    if (!decoded) return errorResponse("غیرمجاز", 401);

    const codes = await generateUserRecoveryCodes(decoded.userId);
    return successResponse("کدهای بازیابی جدید ایجاد شد", { codes });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
