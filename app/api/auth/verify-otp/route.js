// app/api/auth/verify-otp/route.js
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request) {
  const { userId, code, deviceInfo, purpose = 'login' } = await request.json();
  
  // پیدا کردن OTP
  const otp = await prisma.otpCode.findFirst({
    where: {
      userId,
      code,
      type: purpose,
      usedAt: null,
      expiresAt: { gt: new Date() }
    }
  });
  
  if (!otp) {
    return NextResponse.json({ error: 'کد نامعتبر یا منقضی شده است' }, { status: 401 });
  }
  
  // علامت‌گذاری به عنوان استفاده شده
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { usedAt: new Date() }
  });
  
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user) {
    return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
  }
  
  const deviceFingerprint = deviceInfo.fingerprint;
  
  // بررسی دستگاه ثبت شده
  let trustedDevice = await prisma.trustedDevice.findUnique({
    where: { deviceFingerprint }
  });
  
  // اگر دستگاه جدید است و میخواد لاگین عادی کنه → ممنوع
  if (!trustedDevice && purpose === 'login') {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'BLOCKED_NEW_DEVICE',
        ipAddress: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        details: {
          deviceName: deviceInfo.deviceName,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          message: 'تلاش برای ورود از دستگاه جدید بدون تایید'
        }
      }
    });
    
    return NextResponse.json({ 
      error: 'این دستگاه قبلاً ثبت نشده است',
      requiresDeviceVerification: true 
    }, { status: 403 });
  }
  
  // اگر دستگاه جدید است و کد تایید دستگاه رو وارد کرده → ثبت کن
  if (!trustedDevice && purpose === 'device_verification') {
    trustedDevice = await prisma.trustedDevice.create({
      data: {
        userId: user.id,
        deviceFingerprint,
        deviceName: deviceInfo.deviceName || 'Unknown',
        deviceType: deviceInfo.deviceType || 'desktop',
        browser: deviceInfo.browser || 'Unknown',
        os: deviceInfo.os || 'Unknown',
        ipAddress: deviceInfo.ip,
        firstSeenAt: new Date(),
        lastUsedAt: new Date()
      }
    });
    
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DEVICE_REGISTERED',
        deviceId: trustedDevice.id,
        ipAddress: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        details: {
          deviceName: deviceInfo.deviceName,
          browser: deviceInfo.browser,
          os: deviceInfo.os
        }
      }
    });
  }
  
  // به‌روزرسانی آخرین استفاده
  if (trustedDevice) {
    await prisma.trustedDevice.update({
      where: { id: trustedDevice.id },
      data: { lastUsedAt: new Date() }
    });
  }
  
  // تولید JWT
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const token = await new SignJWT({ 
    userId: user.id, 
    email: user.email,
    deviceId: trustedDevice.id,
    deviceFingerprint
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
  
  // ذخیره session
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  await prisma.authSession.create({
    data: {
      userId: user.id,
      deviceId: trustedDevice.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
  
  // ست کردن کوکی
  cookies().set({
    name: 'secure_recover_session',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
  
  return NextResponse.json({ success: true });
}