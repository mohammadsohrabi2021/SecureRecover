"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// تعریف طرح‌های اعتبارسنجی برای هر مرحله
const identifierSchema = z.object({
  identifier: z.string().min(1, "لطفاً ایمیل یا شماره موبایل را وارد کنید"),
});

// ✅ تغییر به ۶ رقم
const otpSchema = z.object({
  otp: z.string().length(6, "کد تایید باید ۶ رقم باشد"),
});

const recoverySchema = z.object({
  identifier: z.string().min(1, "ایمیل یا موبایل الزامی است"),
  recoveryCode: z.string().min(8, "کد بازیابی باید ۸ کاراکتر باشد"),
});

export default function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState("identifier"); // identifier | otp | recovery
  const [userIdentifier, setUserIdentifier] = useState("");
  const [loading, setLoading] = useState(false);

  // استفاده از React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(
      step === "identifier"
        ? identifierSchema
        : step === "otp"
        ? otpSchema
        : recoverySchema
    ),
  });

  // ۱. مرحله ارسال OTP
  async function onSendOtp(data) {
    setLoading(true);
    try {
      const result = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: data.identifier }),
      });

      setUserIdentifier(data.identifier);
      toast.success("کد تایید ۶ رقمی ارسال شد ✅");

      // ✅ هدایت به صفحه تخصصی OTP با ۶ رقم
      router.push(
        `/verify-otp?identifier=${encodeURIComponent(data.identifier)}`
      );
    } catch (err) {
      if (err.message.includes("ثبت نام نشده")) {
        toast.error(err.message);
      } else {
        toast.error(err.message || "خطا در ارسال کد");
      }
    } finally {
      setLoading(false);
    }
  }

  // ۲. مرحله تایید OTP (دیگر استفاده نمی‌شود چون به صفحه جدا هدایت می‌شود)
  // اما برای حفظ ساختار نگه می‌داریم
  async function onVerifyOtp(data) {
    // این تابع دیگر استفاده نمی‌شود
    console.log("Verify OTP called", data);
  }

  // ۳. مرحله ورود با کد بازیابی
  async function onRecoveryLogin(data) {
    setLoading(true);
    try {
      await apiFetch("/auth/recovery-login", {
        method: "POST",
        body: JSON.stringify({
          identifier: data.identifier,
          code: data.recoveryCode,
        }),
      });
      toast.success("ورود با کد بازیابی موفق بود ✅");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err.message || "کد بازیابی نامعتبر است");
    } finally {
      setLoading(false);
    }
  }

  // تابع کمکی برای هندل کردن سابمیت فرم بر اساس مرحله
  const handleFormSubmit = (data) => {
    if (step === "identifier") onSendOtp(data);
    else if (step === "recovery") onRecoveryLogin(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-xl p-10 rounded-4xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100"
    >
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-gray-900 mb-3">
          {step === "recovery" ? "بازیابی حساب" : "خوش آمدید"}
        </h1>
        <p className="text-gray-500 text-sm">
          {step === "recovery"
            ? "برای بازیابی حساب، کد بازیابی خود را وارد کنید"
            : "لطفاً ایمیل یا شماره موبایل خود را وارد کنید"}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6 text-right"
        dir="rtl"
      >
        <AnimatePresence mode="wait">
          {/* بخش ورودی ایمیل/موبایل (مرحله اول) */}
          {step === "identifier" && (
            <motion.div
              key="id-step"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 10, opacity: 0 }}
              className="space-y-2"
            >
              <label className="text-sm font-bold text-gray-700 mr-1">
                پست الکترونیک یا شماره تماس
              </label>
              <input
                {...register("identifier")}
                placeholder="name@company.com یا 09123456789"
                dir="ltr"
                className={`w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 transition-all outline-none text-left ${
                  errors.identifier
                    ? "border-red-100 focus:border-red-500"
                    : "border-transparent focus:border-blue-500 focus:bg-white"
                }`}
              />
              {errors.identifier && (
                <p className="text-red-500 text-xs mt-1 mr-1">
                  {errors.identifier.message}
                </p>
              )}
            </motion.div>
          )}

          {/* بخش ورود با Recovery (مرحله بازیابی) */}
          {step === "recovery" && (
            <motion.div
              key="rec-step"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 10, opacity: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 mr-1">
                  ایمیل یا شماره تماس
                </label>
                <input
                  {...register("identifier")}
                  placeholder="name@company.com یا 09123456789"
                  dir="ltr"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-purple-500 outline-none text-left"
                />
                {errors.identifier && (
                  <p className="text-red-500 text-xs mt-1 mr-1">
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 mr-1">
                  کد بازیابی (۸ کاراکتر)
                </label>
                <input
                  {...register("recoveryCode")}
                  placeholder="مثلاً: A1B2C3D4"
                  dir="ltr"
                  className={`w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 transition-all outline-none text-center font-mono ${
                    errors.recoveryCode
                      ? "border-red-100 focus:border-red-500"
                      : "border-transparent focus:border-purple-500"
                  }`}
                />
                {errors.recoveryCode && (
                  <p className="text-red-500 text-xs mt-1 mr-1">
                    {errors.recoveryCode.message}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={isSubmitting || loading}
          className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all disabled:opacity-70 ${
            step === "recovery"
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
          }`}
        >
          {isSubmitting || loading
            ? "در حال پردازش..."
            : step === "identifier"
            ? "ارسال کد تایید"
            : "بازیابی و ورود"}
        </button>

        {/* لینک‌های کمکی */}
        <div className="flex flex-col items-center space-y-4 mt-8 text-sm">
          {step === "identifier" ? (
            <button
              type="button"
              onClick={() => setStep("recovery")}
              className="text-blue-600 hover:underline transition-colors"
            >
              ورود با کد بازیابی
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep("identifier")}
              className="text-gray-500 hover:underline transition-colors"
            >
              بازگشت به ورود عادی
            </button>
          )}

          <p className="text-gray-500">
            حساب کاربری ندارید؟{" "}
            <a
              href="/register"
              className="text-blue-600 font-bold hover:underline transition-colors"
            >
              ثبت‌نام رایگان
            </a>
          </p>
        </div>
      </form>
    </motion.div>
  );
}
