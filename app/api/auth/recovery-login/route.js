// app/api/auth/recovery-login/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { useRecoveryCode } from '@/services/recovery.service'; // ✅ استفاده از سرویس
import Session from '@/models/Session';
import crypto from 'crypto';

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json().catch(() => ({}));
    const { identifier, code, deviceFingerprint } = body;
    
    console.log("🔐 Recovery login request:", { 
      identifier, 
      codeLength: code?.length,
      deviceFingerprint 
    });
    
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // پیدا کردن کاربر
    const user = await User.findOne({
      $or: [
        { email: identifier?.toLowerCase() },
        { phone: identifier?.replace(/\D/g, '') }
      ]
    });
    
    if (!user) {
      console.log("❌ User not found:", identifier);
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }
    
    console.log("✅ User found:", user.email);
    
    // ✅ استفاده از تابع useRecoveryCode از سرویس
    try {
      await useRecoveryCode(user._id, code, { ip, userAgent });
      console.log("✅ Recovery code verified successfully");
    } catch (error) {
      console.log("❌ Recovery code verification failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    // تولید JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }
    
    const sessionId = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.randomBytes(64).toString('hex');
    const deviceId = deviceFingerprint || `device_${Date.now()}`;
    
    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
      sessionId,
      tokenHash,
      deviceId
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);
    
    console.log("✅ JWT token generated");
    
    // ذخیره session
    await Session.create({
      userId: user._id,
      sessionId,
      tokenHash,
      deviceId,
      deviceName: "Recovery Login",
      userAgent,
      ip,
      lastActive: new Date(),
      isValid: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    console.log("✅ Session created");
    
    // ست کردن کوکی
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'secure_recover_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
    
    console.log("✅ Cookie set");
    
    return NextResponse.json({ 
      success: true,
      message: "ورود با کد بازیابی موفقیت‌آمیز بود"
    });
    
  } catch (error) {
    console.error('❌ Recovery login error:', error);
    return NextResponse.json({ 
      error: error.message || 'خطای داخلی سرور' 
    }, { status: 500 });
  }
}