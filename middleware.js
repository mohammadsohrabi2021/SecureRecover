// middleware.js - نسخه بسیار ساده
import { NextResponse } from "next/server";

const COOKIE_NAME = "secure_recover_session";

// فقط بررسی وجود توکن (بدون اعتبارسنجی)
export function middleware(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;
  
  const isPublicPath = pathname === "/login" || 
                       pathname === "/register" || 
                       pathname === "/verify-otp" || 
                       pathname === "/verify-2fa";
  
  // محافظت از داشبورد
  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // هدایت کاربر لاگین شده
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/verify-otp",
    "/verify-2fa"
  ],
};