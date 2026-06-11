// app/api/auth/generate-recovery-codes/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import RecoveryCode from '@/models/RecoveryCode';
import { logSecurityEvent } from '@/services/security.service';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function POST(request) {
  try {
    await connectDB();
    
    // ✅ اصلاح مهم: await cookies()
    const cookieStore = await cookies();
    const token = cookieStore.get('secure_recover_session')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // حذف کدهای قبلی
    await RecoveryCode.deleteMany({ userId: payload.userId });
    
    // تولید 6 کد جدید
    const rawCodes = [];
    const codesToSave = [];
    
    for (let i = 0; i < 6; i++) {
      const part1 = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 4);
      const part2 = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 4);
      const rawCode = `${part1}-${part2}`;
      rawCodes.push(rawCode);
      
      const codeHash = await bcrypt.hash(rawCode, 12);
      codesToSave.push({
        userId: payload.userId,
        codeHash,
        used: false,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });
    }
    
    await RecoveryCode.insertMany(codesToSave);
    
    await logSecurityEvent({
      userId: payload.userId,
      action: 'RECOVERY_CODES_GENERATED',
      status: 'success',
      request: { headers: { get: () => 'system' } },
      details: { count: 6 }
    });
    
    return NextResponse.json({
      codes: rawCodes,
      warning: 'این کدها فقط یکبار نمایش داده می‌شوند. آنها را در جای امنی ذخیره کنید.'
    });
    
  } catch (error) {
    console.error('Generate recovery codes error:', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}