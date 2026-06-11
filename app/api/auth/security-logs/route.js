// app/api/auth/security-logs/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/mongodb';
import SecurityLog from '@/models/SecurityLog';

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
    
    const logs = await SecurityLog.find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    return NextResponse.json({ 
      success: true, 
      logs: logs.map(log => ({
        action: log.action,
        status: log.status,
        ip: log.ip,
        userAgent: log.userAgent,
        details: log.details,
        createdAt: log.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Security logs error:', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}