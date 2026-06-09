// app/api/auth/check-device/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  const { deviceFingerprint } = await request.json();
  
  const device = await prisma.trustedDevice.findUnique({
    where: { deviceFingerprint }
  });
  
  return NextResponse.json({ 
    isTrusted: !!device,
    device 
  });
}