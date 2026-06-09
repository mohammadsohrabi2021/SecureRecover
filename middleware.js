// middleware.js
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "secure_recover_session";
export const runtime = "experimental-edge";

async function verifyAndGetSession(token, secret) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// ✅ تغییر: به جای proxy، از middleware استفاده کن
export async function middleware(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;
  
  let isAuthenticated = false;
  
  if (token) {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const sessionData = await verifyAndGetSession(token, secret);
    isAuthenticated = !!sessionData;
  }
  
  // مسیرهای عمومی
  const isPublicPath = pathname.startsWith("/login") || 
                       pathname.startsWith("/register") ||
                       pathname.startsWith("/verify-otp");
  
  // اگر لاگین نیست و می‌خواهد به داشبورد برود
  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // اگر لاگین است و می‌خواهد به login/register برود
  if (isPublicPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/verify-otp"],
};