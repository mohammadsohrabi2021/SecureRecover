// app/api/auth/check-device/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TrustedDevice from '@/models/TrustedDevice';

export async function POST(request) {
  try {
    await connectDB();
    
    const { deviceFingerprint } = await request.json();
    
    const device = await TrustedDevice.findOne({
      deviceId: deviceFingerprint,
      isActive: true
    });
    
    return NextResponse.json({
      isTrusted: !!device,
      device: device ? {
        id: device._id,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        browser: device.browser,
        os: device.os,
        lastUsedAt: device.lastUsedAt
      } : null
    });
    
  } catch (error) {
    console.error('Check device error:', error);
    return NextResponse.json({ isTrusted: false }, { status: 500 });
  }
}