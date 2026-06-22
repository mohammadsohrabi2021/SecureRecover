import { z } from "zod";

export const identifierSchema = z
  .string()
  .min(1, "ایمیل یا شماره تلفن الزامی است")
  .refine(
    (val) => val.includes("@") || /^09[0-9]{9}$/.test(val),
    "فرمت ایمیل یا شماره تلفن نامعتبر است"
  );

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
  phone: z.string().regex(/^09[0-9]{9}$/, "شماره تلفن نامعتبر است"),
});

export function getIdentifierType(identifier) {
  if (!identifier) return null;
  if (identifier.includes("@")) return "email";
  if (/^09[0-9]{9}$/.test(identifier)) return "phone";
  return null;
}
