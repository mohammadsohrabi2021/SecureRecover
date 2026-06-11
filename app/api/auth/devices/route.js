// app/api/auth/devices/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/mongodb';
import TrustedDevice from '@/models/TrustedDevice';

export async function GET() {
  try {
    // دریافت کوکی
    const cookieStore = await cookies();
    const token = cookieStore.get('secure_recover_session')?.value;
    
    // بررسی وجود توکن
    if (!token) {
      return NextResponse.json({ 
        error: 'احراز هویت نشده است. لطفاً وارد حساب خود شوید.' 
      }, { status: 401 });
    }
    
    // تایید توکن
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // اتصال به دیتابیس
    await connectDB();
    
    // دریافت لیست دستگاه‌های فعال کاربر
    const devices = await TrustedDevice.find({ 
      userId: payload.userId, 
      isActive: true 
    }).sort({ lastUsedAt: -1 });
    
    // بازگشت لیست دستگاه‌ها
    return NextResponse.json({ 
      success: true,
      devices: devices.map(device => ({
        _id: device._id,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        browser: device.browser,
        os: device.os,
        lastUsedAt: device.lastUsedAt,
        isActive: device.isActive
      }))
    });
    
  } catch (error) {
    console.error('خطا در دریافت دستگاه‌ها:', error);
    
    // خطای تایید توکن
    if (error.code === 'ERR_JWT_EXPIRED') {
      return NextResponse.json({ 
        error: 'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.' 
      }, { status: 401 });
    }
    
    // خطای دیتابیس
    if (error.name === 'MongooseError') {
      return NextResponse.json({ 
        error: 'خطا در اتصال به دیتابیس. لطفاً لحظاتی بعد تلاش کنید.' 
      }, { status: 500 });
    }
    
    // خطای عمومی
    return NextResponse.json({ 
      error: 'خطای داخلی سرور. لطفاً بعداً تلاش کنید.' 
    }, { status: 500 });
  }
}

// app/api/auth/devices/route.js - اضافه کردن DELETE

export async function DELETE(request) {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('secure_recover_session')?.value;
      
      if (!token) {
        return NextResponse.json({ 
          error: 'احراز هویت نشده است' 
        }, { status: 401 });
      }
      
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      const { deviceId } = await request.json();
      
      if (!deviceId) {
        return NextResponse.json({ 
          error: 'شناسه دستگاه ارسال نشده است' 
        }, { status: 400 });
      }
      
      await connectDB();
      
      // حذف دستگاه (فقط اگر متعلق به کاربر باشد)
      const result = await TrustedDevice.findOneAndDelete({
        _id: deviceId,
        userId: payload.userId
      });
      
      if (!result) {
        return NextResponse.json({ 
          error: 'دستگاه مورد نظر یافت نشد' 
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'دستگاه با موفقیت حذف شد' 
      });
      
    } catch (error) {
      console.error('خطا در حذف دستگاه:', error);
      return NextResponse.json({ 
        error: 'خطای داخلی سرور' 
      }, { status: 500 });
    }
  }