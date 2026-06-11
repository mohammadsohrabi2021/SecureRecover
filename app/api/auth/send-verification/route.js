// app/api/auth/send-verification/route.js - اصلاح type
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { sendEmailOtp, sendSmsOtp } from '@/services/mail.service';

export async function POST(request) {
  try {
    await connectDB();
    
    const { userId, method, contact } = await request.json();
    
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }
    
    // تعیین روش ارسال (برعکس روش ورود)
    let sendMethod = method === 'email' ? 'phone' : 'email';
    let targetContact = sendMethod === 'email' ? user.email : user.phone;
    
    // حذف OTPهای قبلی
    await Otp.deleteMany({
      identifier: targetContact,
      type: 'device',  // ✅ تغییر از 'device_verification' به 'device'
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    // تولید کد 6 رقمی
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    
    // ذخیره در دیتابیس
    await Otp.create({
      identifier: targetContact,
      type: 'device',  // ✅ تغییر از 'device_verification' به 'device'
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    
    // ارسال کد
    if (sendMethod === 'email') {
      await sendEmailOtp(targetContact, code, 'device');
    } else {
      await sendSmsOtp(targetContact, code);
    }
    
    return NextResponse.json({
      success: true,
      sendMethod,
      targetContact: targetContact.replace(/(.{3}).+(.{2})/, '$1***$2'),
      message: `کد تایید به ${sendMethod === 'email' ? 'ایمیل' : 'شماره تماس'} شما ارسال شد`
    });
    
  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}