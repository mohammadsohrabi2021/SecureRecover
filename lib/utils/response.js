import { NextResponse } from "next/server"

/*
  ساخت پاسخ استاندارد API
*/

export function successResponse(message, data = {}, status = 200) {

  return NextResponse.json({
    success: true,
    message,
    data
  }, { status })

}

export function errorResponse(message, status = 400, errors = null) {

  return NextResponse.json({
    success: false,
    message,
    errors
  }, { status })

}
