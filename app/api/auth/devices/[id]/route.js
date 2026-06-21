// app/api/auth/devices/[id]/route.js
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import connectDB from "@/lib/db";
import TrustedDevice from "@/models/TrustedDevice";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function DELETE(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("secure_recover_session")?.value;
    
    if (!token) {
      return errorResponse("احراز هویت نشده", 401);
    }
    
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return errorResponse("توکن نامعتبر است", 401);
    }
    
    const { id } = await params;
    
    await connectDB();
    
    const device = await TrustedDevice.findOne({
      userId: decoded.userId,
      deviceId: id,
      isActive: true
    });
    
    if (!device) {
      return errorResponse("دستگاه یافت نشد", 404);
    }
    
    device.isActive = false;
    await device.save();
    
    return successResponse("دستگاه غیرفعال شد", { deviceId: id });
    
  } catch (error) {
    console.error("DELETE device error:", error);
    return errorResponse(error.message, 500);
  }
}

export async function PUT(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("secure_recover_session")?.value;
    
    if (!token) {
      return errorResponse("احراز هویت نشده", 401);
    }
    
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return errorResponse("توکن نامعتبر است", 401);
    }
    
    const { id } = await params;
    const body = await req.json();
    const { deviceName, deviceType, browser, os } = body;
    
    await connectDB();
    
    const device = await TrustedDevice.findOne({
      userId: decoded.userId,
      deviceId: id,
      isActive: true
    });
    
    if (!device) {
      return errorResponse("دستگاه یافت نشد", 404);
    }
    
    if (deviceName) device.deviceName = deviceName;
    if (deviceType) device.deviceType = deviceType;
    if (browser) device.browser = browser;
    if (os) device.os = os;
    
    await device.save();
    
    return successResponse("دستگاه به‌روزرسانی شد", { device });
    
  } catch (error) {
    console.error("PUT device error:", error);
    return errorResponse(error.message, 500);
  }
}