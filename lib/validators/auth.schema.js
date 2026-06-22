import { z } from "zod";

const IRAN_MOBILE_REGEX = /^09\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const identifierSchema = z
  .string()
  .trim()
  .min(1, "لطفاً ایمیل یا شماره موبایل خود را وارد کنید")
  .superRefine((val, ctx) => {
    if (val.includes("@")) {
      if (!EMAIL_REGEX.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "فرمت ایمیل نامعتبر است",
        });
      }
      return;
    }

    if (/^09/.test(val) || /^\d+$/.test(val)) {
      if (!IRAN_MOBILE_REGEX.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود",
        });
      }
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "لطفاً یک ایمیل معتبر یا شماره موبایل ایرانی (۰۹xxxxxxxxx) وارد کنید",
    });
  });

export const loginRequestSchema = z.object({
  identifier: identifierSchema,
  deviceId: z.string().min(8).optional(),
});

export const verifyOtpSchema = z.object({
  identifier: z.string().min(1),
  code: z.string().length(6, "کد باید ۶ رقم باشد").regex(/^\d+$/, "کد باید عدد باشد"),
  sessionId: z.string().optional(),
  deviceId: z.string().optional(),
  type: z.enum(["email", "phone"]).optional(),
});

export const verifyRecoverySchema = z.object({
  sessionId: z.string().min(1),
  recoveryCode: z
    .string()
    .length(8, "کد بازیابی باید ۸ کاراکتر باشد")
    .regex(/^[A-Za-z0-9]+$/, "کد بازیابی نامعتبر است"),
  deviceId: z.string().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email("ایمیل نامعتبر است"),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود"),
});

export function getIdentifierType(identifier) {
  if (!identifier) return null;
  if (identifier.includes("@")) return "email";
  if (IRAN_MOBILE_REGEX.test(identifier)) return "phone";
  return null;
}

export function getZodErrorMessage(error, fallback = "لطفاً اطلاعات را به درستی وارد کنید") {
  return error.issues[0]?.message ?? fallback;
}
