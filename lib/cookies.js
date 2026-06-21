export const COOKIE_NAME = "secure_recover_session";

export function createAuthCookie(token) {
  const isProduction = process.env.NODE_ENV === "production";

  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; ${isProduction ? "Secure; " : ""}Max-Age=604800`;
}

export function clearAuthCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}