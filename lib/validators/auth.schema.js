// lib/validators/auth.schema.js
import { z } from "zod";

// اسکیما برای ورود - جداگانه برای ایمیل و تلفن
export const loginSchema = {
  email: z.string().email("ایمیل نامعتبر است"),
  phone: z.string().regex(/^09[0-9]{9}$/, "شماره تلفن باید با 09 شروع شود و 11 رقم باشد")
};

// اسکیما برای تأیید OTP
export const verifyOtpSchema = z.object({
  identifier: z.string().min(1, "ایمیل یا شماره تلفن الزامی است"),
  code: z.string().length(6, "کد باید ۶ رقم باشد")
});

// اسکیما برای ثبت نام
export const registerSchema = z.object({
  name: z.string().min(3, "نام حداقل ۳ حرف است").max(50, "نام حداکثر ۵۰ حرف است"),
  email: z.string().email("ایمیل نامعتبر است"),
  phone: z.string().regex(/^09[0-9]{9}$/, "شماره تلفن باید با 09 شروع شود و 11 رقم باشد"),
});

// تابع کمکی برای تشخیص نوع identifier
export function getIdentifierType(identifier) {
  if (!identifier) return null;
  if (identifier.includes("@")) return "email";
  if (/^09[0-9]{9}$/.test(identifier)) return "phone";
  return null;
}