// app/api/auth/sessions/revoke-all/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';

export async function POST(request) {
  try {
    await connectDB();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('secure_recover_session')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'احراز هویت نشده است' }, { status: 401 });
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // پیدا کردن نشست جاری
    const currentSession = await Session.findOne({
      userId: payload.userId,
      tokenHash: payload.tokenHash,
      isValid: true
    });
    
    // حذف همه نشست‌های دیگر
    const result = await Session.deleteMany({
      userId: payload.userId,
      _id: { $ne: currentSession?._id }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `${result.deletedCount} نشست حذف شد`,
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}