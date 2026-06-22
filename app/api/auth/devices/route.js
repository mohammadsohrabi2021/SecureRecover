// app/api/auth/devices/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt'; 
import connectDB from '@/lib/db';
import TrustedDevice from '@/models/TrustedDevice';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('secure_recover_session')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        error: 'احراز هویت نشده است. لطفاً وارد حساب خود شوید.' 
      }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ 
        error: 'توکن نامعتبر است' 
      }, { status: 401 });
    }
    
    await connectDB();
    
    const devices = await TrustedDevice.find({ 
      userId: decoded.userId, 
      isActive: true 
    }).sort({ lastUsedAt: -1 });
    
    return NextResponse.json({ 
      success: true,
      devices: devices.map(device => ({
        _id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        browser: device.browser,
        os: device.os,
        lastUsedAt: device.lastUsedAt,
        lastUsedIp: device.lastUsedIp,
        loginCount: device.loginCount,
        isActive: device.isActive
      }))
    });
    
  } catch (error) {
    console.error('خطا در دریافت دستگاه‌ها:', error);
    return NextResponse.json({ 
      error: 'خطای داخلی سرور' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('secure_recover_session')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        error: 'احراز هویت نشده است' 
      }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ 
        error: 'توکن نامعتبر است' 
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { deviceId, deviceName, deviceType, browser, os, userAgent, ip } = body;
    
    if (!deviceId) {
      return NextResponse.json({ 
        error: 'deviceId الزامی است' 
      }, { status: 400 });
    }
    
    await connectDB();
    
    let device = await TrustedDevice.findOne({
      userId: decoded.userId,
      deviceId: deviceId
    });
    
    if (device) {
      device.lastUsedAt = new Date();
      device.lastUsedIp = ip || device.lastUsedIp;
      device.loginCount += 1;
      await device.save();
    } else {
      device = await TrustedDevice.create({
        userId: decoded.userId,
        deviceId,
        deviceName: deviceName || 'Unknown Device',
        deviceType: deviceType || 'unknown',
        browser: browser || 'Unknown',
        os: os || 'Unknown',
        userAgent: userAgent || 'Unknown',
        lastUsedIp: ip || 'unknown',
        loginCount: 1,
        isActive: true
      });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'دستگاه با موفقیت ثبت شد',
      device
    });
    
  } catch (error) {
    console.error('POST device error:', error);
    return NextResponse.json({ 
      error: 'خطای داخلی سرور' 
    }, { status: 500 });
  }
}