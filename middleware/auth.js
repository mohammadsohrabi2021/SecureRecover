import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { validateSession } from "@/services/auth.service";
import { errorResponse } from "@/lib/utils/response";
import { COOKIE_NAME } from "@/lib/cookies";

/**
 * Authenticate an API request via session cookie + JWT + DB session validation.
 * Returns { userId, sessionId, token } or a NextResponse error.
 */
export async function authenticateRequest() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return { error: errorResponse("احراز هویت نشده", 401) };
  }

  const decoded = verifyToken(token);

  if (!decoded?.userId || !decoded?.sessionId) {
    return { error: errorResponse("توکن نامعتبر است", 401) };
  }

  const isValid = await validateSession(decoded.sessionId, decoded.userId);

  if (!isValid) {
    const response = errorResponse("جلسه شما منقضی شده است", 401);
    response.cookies.delete(COOKIE_NAME);
    return { error: response };
  }

  return {
    userId: decoded.userId,
    sessionId: decoded.sessionId,
    token,
  };
}
