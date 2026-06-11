// app/api/auth/sessions/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';
import { jwtVerify } from 'jose';

// تابع کمکی برای پاسخ موفق
function successResponse(message, data) {
  return NextResponse.json({ success: true, message, data });
}

// تابع کمکی برای پاسخ خطا
function errorResponse(message, status) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request) {
  try {
    await connectDB();
    
    // ✅ اصلاح: استفاده از cookies() با await
    const cookieStore = await cookies();
    const token = cookieStore.get('secure_recover_session')?.value;
    
    if (!token) {
      return errorResponse('احراز هویت انجام نشده است', 401);
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    const sessions = await Session.find({
      userId: payload.userId
    }).sort({ createdAt: -1 });
    
    const formatted = sessions.map((session) => ({
      id: session._id,
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      browser: session.browser,
      os: session.os,
      ip: session.ip,
      lastActive: session.lastActive,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.tokenHash === payload.tokenHash
    }));
    
    return successResponse('نشست‌ها دریافت شدند', formatted);
    
  } catch (error) {
    console.error('Sessions error:', error);
    return errorResponse('دسترسی غیرمجاز', 401);
  }
}