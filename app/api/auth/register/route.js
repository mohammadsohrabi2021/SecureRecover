// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import TrustedDevice from '@/models/TrustedDevice';
import { collectDeviceInfo, getDeviceFingerprint } from '@/lib/device-fingerprint';

export async function POST(request) {
  try {
    console.log('📝 Register API called');
    
    await connectDB();
    
    // دریافت اطلاعات از body
    const { name, email, phone, deviceInfo } = await request.json();
    
    // دریافت IP کاربر
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    console.log(`📊 Registering: ${email}, IP: ${ip}, Device: ${deviceInfo?.deviceName}`);
    
    // بررسی وجود کاربر
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: phone.replace(/\D/g, '') }
      ]
    });
    
    if (existingUser) {
      return NextResponse.json({ 
        error: 'این ایمیل یا شماره تلفن قبلاً ثبت شده است' 
      }, { status: 409 });
    }
    
    // ============================================
    // ✅ ایجاد کاربر با اطلاعات کامل
    // ============================================
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone.replace(/\D/g, ''),
      lastLoginIp: ip,           // ✅ ذخیره IP ثبت‌نام
      lastLoginDevice: deviceInfo?.deviceName || userAgent,  // ✅ ذخیره دستگاه
      lastLoginAt: new Date(),   // ✅ ذخیره زمان ثبت‌نام
      createdAt: new Date()
    });
    
    console.log(`✅ User created: ${user._id}`);
    
    // ============================================
    // ✅ ثبت دستگاه به عنوان Trusted Device (اولین دستگاه)
    // ============================================
    if (deviceInfo && deviceInfo.fingerprint) {
      const existingDevice = await TrustedDevice.findOne({
        userId: user._id,
        deviceId: deviceInfo.fingerprint
      });
      
      if (!existingDevice) {
        await TrustedDevice.create({
          userId: user._id,
          deviceId: deviceInfo.fingerprint,
          deviceName: deviceInfo.deviceName || 'Unknown',
          deviceType: deviceInfo.deviceType || 'desktop',
          browser: deviceInfo.browser || 'Unknown',
          os: deviceInfo.os || 'Unknown',
          lastUsedIp: ip,
          lastUsedAt: new Date(),
          isActive: true,
          trustedAt: new Date()
        });
        console.log(`✅ Trusted device registered: ${deviceInfo.deviceName}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      message: 'ثبت نام با موفقیت انجام شد'
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Register error:', error);
    return NextResponse.json({ 
      error: 'خطای داخلی سرور',
      details: error.message
    }, { status: 500 });
  }
}