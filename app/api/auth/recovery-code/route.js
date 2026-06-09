// app/api/auth/recovery-codes/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function POST() {
  const token = cookies().get('secure_recover_session')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // تولید کدهای جدید
  const newCodes = Array.from({ length: 6 }, () => 
    Math.random().toString(36).substring(2, 10).toUpperCase()
  )

  // ذخیره در دیتابیس
  
  return NextResponse.json({ codes: newCodes })
}