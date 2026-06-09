// app/api/auth/login/route.js
import { sendOtp } from "@/services/otp.service";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { rateLimit } from "@/lib/rate-limit";
import User from "@/models/User";
import connectDB from "@/lib/db";

export async function POST(req) {
  try {
    console.log("=== LOGIN API CALLED ===");
    
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rateLimitResult = await rateLimit(ip, "login-request", 3, 60);
    if (!rateLimitResult.success) {
      return errorResponse("تعداد درخواست‌های بیش از حد. لطفاً بعداً تلاش کنید.", 429);
    }

    const body = await req.json().catch(() => ({}));
    console.log("Received body:", JSON.stringify(body, null, 2));
    
    let identifier = null;
    let type = null;
    
    if (body.identifier && body.identifier.trim() !== "") {
      identifier = body.identifier.trim();
      if (identifier.includes("@")) {
        type = "email";
      } else if (/^09[0-9]{9}$/.test(identifier)) {
        type = "phone";
      } else {
        return errorResponse("فرمت ایمیل یا شماره تلفن نامعتبر است", 400);
      }
    } else if (body.email && body.email.trim() !== "") {
      identifier = body.email.trim();
      type = "email";
    } else if (body.phone && body.phone.trim() !== "") {
      identifier = body.phone.trim();
      type = "phone";
    } else {
      return errorResponse("ایمیل یا شماره تلفن الزامی است", 400);
    }
    
    // ✅ بررسی وجود کاربر در دیتابیس
    await connectDB();
    let userExists = false;
    if (type === "email") {
      const user = await User.findOne({ email: identifier });
      userExists = !!user;
    } else if (type === "phone") {
      const user = await User.findOne({ phone: identifier });
      userExists = !!user;
    }
    
    const userAgent = req.headers.get("user-agent") || "unknown";
    const requestMeta = { ip, userAgent };
    
    // ✅ اگر کاربر وجود ندارد، خطا برگردان (برای تجربه کاربری بهتر)
    if (!userExists) {
      console.log(`User not found: ${identifier}`);
      return errorResponse(
        type === "email" ? "این ایمیل ثبت نام نشده است" : "این شماره تلفن ثبت نام نشده است",
        404
      );
    }
    
    // ارسال OTP
    await sendOtp(identifier, type, requestMeta);
    
    return successResponse("کد تأیید ارسال شد", {
      identifier: identifier.slice(0, -4) + "****",
      type
    });
    
  } catch (error) {
    console.error("LOGIN REQUEST ERROR:", error);
    return errorResponse(error.message || "خطا در ارسال کد تأیید", 500);
  }
}