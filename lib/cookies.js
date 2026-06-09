// lib/cookies.js
import { cookies } from "next/headers";

export function createAuthCookie(token) {
  const isProduction = process.env.NODE_ENV === "production";
  
  return `secure_recover_session=${token}; Path=/; HttpOnly; SameSite=Strict; ${isProduction ? "Secure; " : ""}Max-Age=604800`;
}

export function clearAuthCookie() {
  return `secure_recover_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

// ✅ تابع جدید برای دریافت کوکی در سرور
export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get("secure_recover_session")?.value;
}