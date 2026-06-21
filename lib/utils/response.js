import { NextResponse } from "next/server";

export function successResponse(message, data = null, status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

export function errorResponse(message, status = 400, errors = null) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}