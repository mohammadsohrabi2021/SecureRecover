// app/api/auth/send-otp/route.js
import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  const { email, phone, deviceFingerprint, purpose = 'login' } = await request.json();
  
  // پیدا کردن کاربر
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email?.toLowerCase() },
        { phone: phone?.replace(/\D/g, '') }
      ]
    }
  });
  
  if (!user) {
    return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
  }
  
  // بررسی اینکه دستگاه قبلاً ثبت شده یا نه
  let existingDevice = null;
  if (deviceFingerprint) {
    existingDevice = await prisma.trustedDevice.findUnique({
      where: { deviceFingerprint }
    });
  }
  
  // حذف OTPهای قبلی
  await prisma.otpCode.deleteMany({
    where: {
      userId: user.id,
      type: purpose,
      expiresAt: { gt: new Date() },
      usedAt: null
    }
  });
  
  // تولید کد ۶ رقمی
  const code = randomInt(100000, 999999).toString();
  
  // ذخیره در دیتابیس
  await prisma.otpCode.create({
    data: {
      userId: user.id,
      code,
      type: purpose,
      deviceId: existingDevice?.id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });
  
  // برای تست - در production ایمیل واقعی بفرست
  console.log(`📧 OTP for ${user.email}: ${code}`);
  
  return NextResponse.json({ 
    success: true, 
    userId: user.id,
    isNewDevice: purpose === 'login' && !existingDevice
  });
}