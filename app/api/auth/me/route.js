// app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Session from '@/models/Session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('secure_recover_session')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    await connectDB();
    
    // ✅ بررسی وجود session معتبر در دیتابیس
    const session = await Session.findOne({
      userId: payload.userId,
      tokenHash: payload.tokenHash,
      isValid: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
    
    const user = await User.findById(payload.userId).select('-__v');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user });
    
  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}