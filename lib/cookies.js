import { NextResponse } from "next/server";

export const COOKIE_NAME = "secure_recover_session";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export function createAuthCookie(token) {
  const isProduction = process.env.NODE_ENV === "production";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; ${isProduction ? "Secure; " : ""}Max-Age=${MAX_AGE}`;
}

export function clearAuthCookie() {
  const isProduction = process.env.NODE_ENV === "production";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; ${isProduction ? "Secure; " : ""}Max-Age=0`;
}

export function setAuthCookieOnResponse(response, token) {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: isProduction,
    maxAge: MAX_AGE,
    path: "/",
  });
  return response;
}

export function jsonWithAuthCookie(message, data, token, status = 200) {
  const response = NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
  if (token) setAuthCookieOnResponse(response, token);
  return response;
}
