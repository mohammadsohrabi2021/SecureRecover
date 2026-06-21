import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "لطفاً ایمیل یا شماره موبایل را وارد کنید")
});

export const verifyOtpSchema = z.object({
  identifier: z.string().min(1, "شناسه کاربری الزامی است"),
  code: z.string().length(6, "کد تأیید باید ۶ رقم باشد")
});

export const registerSchema = z.object({
  name: z.string().min(3, "نام حداقل ۳ حرف است").max(50, "نام حداکثر ۵۰ حرف است"),
  email: z.string().email("ایمیل نامعتبر است"),
  phone: z.string().regex(/^09[0-9]{9}$/, "شماره تلفن باید با 09 شروع شود و 11 رقم باشد")
});

export const recoveryCodeSchema = z.object({
  code: z.string().length(8, "کد بازیابی باید ۸ کاراکتر باشد")
});

export function getIdentifierType(identifier) {
  if (!identifier) return null;
  if (identifier.includes("@")) return "email";
  if (/^09[0-9]{9}$/.test(identifier)) return "phone";
  return null;
}