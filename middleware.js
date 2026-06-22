import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

const COOKIE_NAME = "secure_recover_session";

const PUBLIC_PATHS = ["/login", "/register", "/verify-otp", "/verify-2fa"];
const AUTH_PATHS = ["/login", "/register", "/verify-otp", "/verify-2fa"];

export function middleware(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");

  if ((isDashboard || isAdmin) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && AUTH_PATHS.some((p) => pathname === p)) {
    const payload = verifyToken(token);
    if (payload?.userId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/verify-otp",
    "/verify-2fa",
  ],
};
