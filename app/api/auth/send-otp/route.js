// app/api/auth/send-otp/route.js - نسخه دیباگ کامل
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import TrustedDevice from '@/models/TrustedDevice';
import { sendEmailOtp } from '@/services/mail.service';

export async function POST(request) {
  try {
    console.log('📡 Send OTP API called');
    
    await connectDB();
    
    const { email, phone, deviceFingerprint, purpose = 'login' } = await request.json();
    
    console.log(`📝 Searching for user: email=${email}, phone=${phone}`);
    
    // ============================================
    // روش 1: جستجو با مدل User
    // ============================================
    let user = null;
    
    if (email) {
      const searchEmail = email.toLowerCase().trim();
      console.log(`🔍 Searching by email: "${searchEmail}"`);
      user = await User.findOne({ email: searchEmail });
      console.log(`📊 Email search result: ${user ? 'FOUND - ' + user.email : 'NOT FOUND'}`);
    }
    
    if (!user && phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      console.log(`🔍 Searching by phone: "${cleanPhone}"`);
      user = await User.findOne({ phone: cleanPhone });
      console.log(`📊 Phone search result: ${user ? 'FOUND - ' + user.email : 'NOT FOUND'}`);
    }
    
    // ============================================
    // روش 2: اگر مدل جواب نداد، مستقیم از MongoDB driver استفاده کن
    // ============================================
    if (!user) {
      console.log('🔄 Trying direct MongoDB query...');
      const mongoose = require('mongoose');
      const db = mongoose.connection.db;
      
      // لیست همه کاربران
      const allUsers = await db.collection('users').find({}).toArray();
      console.log(`📋 Total users in database: ${allUsers.length}`);
      
      if (allUsers.length > 0) {
        console.log('📋 Users in DB:', allUsers.map(u => ({ 
          email: u.email, 
          phone: u.phone,
          id: u._id.toString()
        })));
        
        // سعی کن با email پیدا کنی
        if (email) {
          const foundByEmail = allUsers.find(u => u.email === email.toLowerCase());
          if (foundByEmail) {
            console.log('✅ Found by direct email match!');
            user = foundByEmail;
          }
        }
        
        // سعی کن با phone پیدا کنی
        if (!user && phone) {
          const cleanPhone = phone.replace(/\D/g, '');
          const foundByPhone = allUsers.find(u => u.phone === cleanPhone);
          if (foundByPhone) {
            console.log('✅ Found by direct phone match!');
            user = foundByPhone;
          }
        }
      } else {
        console.log('❌ No users found in database at all!');
        return NextResponse.json({ 
          error: 'هیچ کاربری در دیتابیس ثبت نشده است. لطفاً ابتدا ثبت نام کنید.',
          debug: { usersCount: 0 }
        }, { status: 404 });
      }
    }
    
    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json({ 
        error: 'کاربری با این اطلاعات یافت نشد. لطفاً ابتدا ثبت نام کنید.',
        debug: { 
          searchedEmail: email,
          searchedPhone: phone,
          timestamp: new Date().toISOString()
        }
      }, { status: 404 });
    }
    
    // تبدیل user به فرمت مدل اگر از direct query اومده
    let userId = user._id;
    let userEmail = user.email;
    
    console.log(`✅ User found: ${userEmail} (ID: ${userId})`);
    
    // بررسی دستگاه ثبت شده
    let existingDevice = null;
    let isTrustedDevice = false;
    
    if (deviceFingerprint) {
      existingDevice = await TrustedDevice.findOne({
        userId: userId,
        deviceId: deviceFingerprint,
        isActive: true
      });
      isTrustedDevice = !!existingDevice;
    }
    
    console.log(`📱 Device status: isTrusted=${isTrustedDevice}, purpose=${purpose}`);
    
    // حذف OTPهای قبلی
    await Otp.deleteMany({
      identifier: userEmail,
      type: purpose === 'device_verification' ? 'device' : 'login',
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    // تولید کد 6 رقمی
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    
    // ذخیره OTP
    await Otp.create({
      identifier: userEmail,
      type: purpose === 'device_verification' ? 'device' : 'login',
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    
    // ارسال ایمیل
    await sendEmailOtp(userEmail, code, purpose);
    
    return NextResponse.json({
      success: true,
      userId: userId.toString(),
      isNewDevice: !isTrustedDevice && purpose === 'login',
      isTrustedDevice: isTrustedDevice,
      message: 'کد تأیید ارسال شد'
    });
    
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    return NextResponse.json({ 
      error: 'خطای داخلی سرور',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}