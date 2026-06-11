// app/api/auth/recovery-login/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import RecoveryCode from '@/models/RecoveryCode';
import TrustedDevice from '@/models/TrustedDevice';
import Session from '@/models/Session';
import crypto from 'crypto';

export async function POST(request) {
  try {
    await connectDB();
    
    const { identifier, code, deviceFingerprint } = await request.json();
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
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }
    
    // بررسی دستگاه (برای امنیت، دستگاه باید قبلاً ثبت شده باشد)
    let trustedDevice = null;
    if (deviceFingerprint) {
      trustedDevice = await TrustedDevice.findOne({
        userId: user._id,
        deviceId: deviceFingerprint,
        isActive: true
      });
    }
    
    // اگر دستگاه جدید است، اجازه نده با recovery code وارد شود
    if (!trustedDevice) {
      return NextResponse.json({ 
        error: 'این دستگاه قبلاً ثبت نشده است. ابتدا دستگاه خود را تایید کنید.',
        requiresDeviceVerification: true 
      }, { status: 403 });
    }
    
    // بررسی کد بازیابی
    const allCodes = await RecoveryCode.find({ 
      userId: user._id, 
      used: false 
    });
    
    let isValid = false;
    let usedCode = null;
    
    for (const recoveryCode of allCodes) {
      if (await bcrypt.compare(code, recoveryCode.codeHash)) {
        isValid = true;
        usedCode = recoveryCode;
        break;
      }
    }
    
    if (!isValid) {
      return NextResponse.json({ error: 'کد بازیابی نامعتبر است' }, { status: 401 });
    }
    
    // علامت‌گذاری کد به عنوان استفاده شده
    usedCode.used = true;
    usedCode.usedAt = new Date();
    await usedCode.save();
    
    // به‌روزرسانی آخرین لاگین
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    await user.save();
    
    // تولید JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const sessionId = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.randomBytes(64).toString('hex');
    
    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
      sessionId,
      tokenHash,
      deviceId: trustedDevice.deviceId
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);
    
    // ذخیره session
    await Session.create({
      userId: user._id,
      sessionId,
      tokenHash,
      deviceId: trustedDevice.deviceId,
      deviceName: trustedDevice.deviceName,
      userAgent,
      ip,
      lastActive: new Date(),
      isValid: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
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
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Recovery login error:', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}