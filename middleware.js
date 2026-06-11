// middleware.js - نسخه نهایی و صحیح
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ❌ حذف: connectDB و Session (در Edge Runtime کار نمی‌کنند)

export const config = {
  matcher: ['/dashboard/:path*', '/api/auth/sessions/:path*', '/api/auth/devices/:path*'],
};

export async function middleware(request) {
  const token = request.cookies.get('secure_recover_session')?.value;
  const { pathname } = request.nextUrl;
  
  // مسیرهای عمومی (نیاز به احراز هویت ندارند)
  const isPublicPath = pathname.startsWith('/login') || 
                       pathname.startsWith('/register') ||
                       pathname.startsWith('/verify-otp') ||
                       pathname.startsWith('/verify-device') ||
                       pathname.startsWith('/recover');
  
  // اگر مسیر عمومی است، اجازه بده
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // ============================================
  // اگر توکن وجود ندارد → برو به لاگین
  // ============================================
  if (!token) {
    console.log('🔒 No token found, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    // ============================================
    // تایید توکن و بررسی انقضا
    // ============================================
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // بررسی تاریخ انقضای توکن
    const currentTime = Math.floor(Date.now() / 1000); // زمان فعلی به ثانیه
    if (payload.exp && payload.exp < currentTime) {
      console.log('🔒 Token expired, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // بررسی اینکه payload اطلاعات مورد نیاز را دارد
    if (!payload.userId) {
      console.log('🔒 Invalid token payload, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // ============================================
    // بررسی device fingerprint (اختیاری)
    // ============================================
    const deviceFingerprint = request.headers.get('x-device-fingerprint');
    if (deviceFingerprint && payload.deviceId) {
      // اگر می‌خواهید device fingerprint را بررسی کنید
      // اینجا می‌توانید منطق خود را اضافه کنید
      // فعلاً فقط لاگ می‌گیریم
      console.log(`📱 Device check: token device=${payload.deviceId}, request device=${deviceFingerprint.substring(0, 10)}...`);
    }
    
    // اگر همه چیز اوکی بود، اجازه دسترسی بده
    console.log(`✅ Access granted for user: ${payload.userId}`);
    return NextResponse.next();
    
  } catch (error) {
    // خطاهای احتمالی: توکن نامعتبر، دستکاری شده، یا هر خطای دیگر
    console.error('❌ Middleware error:', error.message);
    
    // حذف کوکی نامعتبر (اختیاری)
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('secure_recover_session');
    
    return response;
  }
}