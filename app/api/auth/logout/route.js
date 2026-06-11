// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// تابع کمکی برای پاسخ موفق
function successResponse(message) {
  return NextResponse.json({ success: true, message });
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('secure_recover_session');
    
    return successResponse('با موفقیت خارج شدید');
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'خطا در خروج از حساب' 
    }, { status: 500 });
  }
}