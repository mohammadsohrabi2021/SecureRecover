// app/api/auth/recovery-codes/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/mongodb';
import RecoveryCode from '@/models/RecoveryCode';

export async function GET() {
  try {
    await connectDB();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('secure_recover_session')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // فقط کدهای استفاده نشده را برگردان (بدون نمایش خود کدها برای امنیت)
    const codes = await RecoveryCode.find({ 
      userId: payload.userId, 
      used: false 
    }).select('codeHash used createdAt');
    
    // برای امنیت، کدهای واقعی را نشان نمی‌دهیم، فقط تعداد
    return NextResponse.json({ 
      success: true, 
      count: codes.length,
      codes: [] // کدهای واقعی فقط هنگام تولید نمایش داده می‌شوند
    });
    
  } catch (error) {
    console.error('Get recovery codes error:', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}