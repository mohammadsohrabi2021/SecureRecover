// app/api/auth/verify-otp/route.js - نسخه نهایی با مدیریت کامل duplicate
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import TrustedDevice from '@/models/TrustedDevice';
import Session from '@/models/Session';

export async function POST(request) {
  try {
    await connectDB();
    
    const { userId, code, deviceInfo, purpose = 'login', loginMethod } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }
    
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    
    // تعیین identifier درست برای جستجوی OTP
    let identifierToSearch;
    let typeToSearch = purpose === 'device_verification' ? 'device' : 'login';
    
    if (purpose === 'device_verification') {
      const loginMethodFromFrontend = loginMethod || deviceInfo?.loginMethod;
      
      if (loginMethodFromFrontend === 'email') {
        identifierToSearch = user.phone;
        console.log(`🔍 Searching OTP with PHONE: ${identifierToSearch}`);
      } else {
        identifierToSearch = user.email;
        console.log(`🔍 Searching OTP with EMAIL: ${identifierToSearch}`);
      }
    } else {
      identifierToSearch = user.email;
    }
    
    const otp = await Otp.findOne({
      identifier: identifierToSearch,
      type: typeToSearch,
      codeHash,
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!otp) {
      console.log('❌ OTP not found');
      return NextResponse.json({ error: 'کد نامعتبر یا منقضی شده است' }, { status: 401 });
    }
    
    console.log(`✅ OTP found!`);
    
    otp.used = true;
    otp.usedAt = new Date();
    await otp.save();
    
    const deviceFingerprint = deviceInfo?.fingerprint;
    
    // ============================================
    // ✅ مدیریت دستگاه (با حلقه برای پیدا کردن deviceId یکتا)
    // ============================================
    let trustedDevice = await TrustedDevice.findOne({
      userId: user._id,
      isActive: true
    });
    
    // اگر دستگاهی برای این کاربر وجود ندارد و purpose device_verification است
    if (!trustedDevice && purpose === 'device_verification' && deviceInfo) {
      let newDeviceId = deviceFingerprint;
      let counter = 1;
      let deviceExists = true;
      
      // حلقه تا زمانی که deviceId یکتا پیدا کنیم
      while (deviceExists) {
        const existing = await TrustedDevice.findOne({ deviceId: newDeviceId });
        if (!existing) {
          deviceExists = false;
        } else {
          newDeviceId = `${deviceFingerprint}_${counter}`;
          counter++;
        }
      }
      
      trustedDevice = await TrustedDevice.create({
        userId: user._id,
        deviceId: newDeviceId,
        deviceName: deviceInfo.deviceName || 'Unknown',
        deviceType: deviceInfo.deviceType || 'desktop',
        browser: deviceInfo.browser || 'Unknown',
        os: deviceInfo.os || 'Unknown',
        lastUsedIp: ip,
        lastUsedAt: new Date(),
        isActive: true,
        trustedAt: new Date()
      });
      console.log(`✅ New trusted device registered with unique ID: ${newDeviceId}`);
    }
    // اگر دستگاه وجود دارد، به‌روزرسانی کن
    else if (trustedDevice) {
      console.log(`✅ Device already exists for this user, updating...`);
      trustedDevice.lastUsedAt = new Date();
      trustedDevice.lastUsedIp = ip;
      await trustedDevice.save();
    }
    
    // اگر دستگاه جدید است و purpose login است → ممنوع
    if (!trustedDevice && purpose === 'login') {
      return NextResponse.json({
        error: 'دستگاه جدید شناسایی شد',
        requiresDeviceVerification: true
      }, { status: 403 });
    }
    
    // به‌روزرسانی آخرین لاگین کاربر
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    user.lastLoginDevice = deviceInfo?.deviceName;
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
      deviceId: trustedDevice?.deviceId || 'unknown'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);
    
    await Session.create({
      userId: user._id,
      sessionId,
      tokenHash,
      deviceId: trustedDevice?.deviceId || 'unknown',
      deviceName: deviceInfo?.deviceName,
      deviceType: deviceInfo?.deviceType,
      browser: deviceInfo?.browser,
      os: deviceInfo?.os,
      userAgent,
      ip,
      lastActive: new Date(),
      isValid: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
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
    
    console.log('✅ Verification successful!');
    
    return NextResponse.json({
      success: true,
      isNewDevice: purpose === 'device_verification'
    });
    
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}