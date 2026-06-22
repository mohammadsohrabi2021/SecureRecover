import { authenticateRequest } from "@/middleware/auth";
import connectDB from "@/lib/db";
import Session from "@/models/Session";
import SecurityLog from "@/models/SecurityLog";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function DELETE(req, { params }) {
  try {
    const auth = await authenticateRequest();
    if (auth.error) return auth.error;

    const { id } = await params;

    if (id === auth.sessionId) {
      return errorResponse(
        "نمی‌توانید جلسه فعلی را از این صفحه ببندید. برای خروج از دکمه خروج استفاده کنید.",
        400
      );
    }

    await connectDB();

    const session = await Session.findOne({
      sessionId: id,
      userId: auth.userId,
      isValid: true,
    });

    if (!session) {
      return errorResponse("جلسه یافت نشد", 404);
    }

    session.isValid = false;
    await session.save();

    await SecurityLog.create({
      userId: auth.userId,
      action: "SESSION_REVOKED",
      status: "success",
      ip: session.ip,
      deviceId: session.deviceId,
      details: { sessionId: id, deviceName: session.deviceName },
    });

    return successResponse("جلسه با موفقیت بسته شد");
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
