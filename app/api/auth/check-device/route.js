// app/api/auth/check-device/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/db'; // ✅ تغییر
import User from '@/models/User';
import TrustedDevice from '@/models/TrustedDevice';

// ✅ GET: برای کاربران لاگین شده (بررسی deviceId با توکن)
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('secure_recover_session')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        isTrusted: false,
        error: 'احراز هویت نشده' 
      }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ 
        isTrusted: false,
        error: 'توکن نامعتبر است' 
      }, { status: 401 });
    }
    
    await connectDB();
    
    const url = new URL(request.url);
    const deviceId = url.searchParams.get('deviceId');
    
    if (!deviceId) {
      return NextResponse.json({ 
        isTrusted: false,
        error: 'deviceId ارسال نشده است' 
      }, { status: 400 });
    }
    
    const device = await TrustedDevice.findOne({
      userId: decoded.userId,
      deviceId: deviceId,
      isActive: true
    });
    
    return NextResponse.json({
      isTrusted: !!device,
      device: device ? {
        id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        browser: device.browser,
        os: device.os,
        lastUsedAt: device.lastUsedAt,
        loginCount: device.loginCount
      } : null
    });
    
  } catch (error) {
    console.error('Check device error:', error);
    return NextResponse.json({ 
      isTrusted: false,
      error: 'خطای داخلی سرور' 
    }, { status: 500 });
  }
}

// ✅ POST: برای قبل از لاگین (بررسی deviceId با identifier)
export async function POST(request) {
  try {
    await connectDB();
    
    const { identifier, deviceId } = await request.json();
    
    if (!identifier) {
      return NextResponse.json({ 
        deviceId: null,
        exists: false,
        error: 'identifier الزامی است' 
      }, { status: 400 });
    }
    
    // پیدا کردن کاربر
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });
    
    if (!user) {
      return NextResponse.json({ 
        deviceId: null,
        exists: false,
        error: 'کاربر یافت نشد' 
      }, { status: 404 });
    }
    
    // اگر deviceId فرستاده شده، بررسی کن که وجود دارد
    if (deviceId) {
      const existingDevice = await TrustedDevice.findOne({
        userId: user._id,
        deviceId: deviceId,
        isActive: true
      });
      
      if (existingDevice) {
        return NextResponse.json({
          deviceId: deviceId,
          exists: true,
          device: {
            id: existingDevice._id,
            deviceId: existingDevice.deviceId,
            deviceName: existingDevice.deviceName,
            deviceType: existingDevice.deviceType,
            browser: existingDevice.browser,
            os: existingDevice.os,
            lastUsedAt: existingDevice.lastUsedAt,
            loginCount: existingDevice.loginCount
          }
        });
      }
    }
    
    // پیدا کردن آخرین دستگاه معتبر کاربر
    const device = await TrustedDevice.findOne({
      userId: user._id,
      isActive: true
    }).sort({ lastUsedAt: -1 });
    
    return NextResponse.json({
      deviceId: device?.deviceId || null,
      exists: !!device,
      device: device ? {
        id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        browser: device.browser,
        os: device.os,
        lastUsedAt: device.lastUsedAt,
        loginCount: device.loginCount
      } : null
    });
    
  } catch (error) {
    console.error('Check device POST error:', error);
    return NextResponse.json({ 
      deviceId: null,
      exists: false,
      error: 'خطای داخلی سرور' 
    }, { status: 500 });
  }
}