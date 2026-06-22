"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function VerifyOTPContent() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get("identifier");
  const inputs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
    setCanResend(true);
  }, [timer]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.value !== "" && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) newOtp[i] = pastedData[i];
      setOtp(newOtp);
      inputs.current[Math.min(pastedData.length - 1, 5)]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("لطفاً کد ۶ رقمی را کامل وارد کنید");
      return;
    }

    setLoading(true);
    try {
      const sessionId = localStorage.getItem("2faSessionId");
      const deviceId = localStorage.getItem("deviceId");
      const type = localStorage.getItem("2faVerifyType") || (identifier?.includes("@") ? "email" : "phone");

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ identifier, code, sessionId, deviceId, type }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok) {
        if (data.data?.nextStep === "recovery") {
          toast.success("کد تأیید شد — کد بازیابی را وارد کنید");
          localStorage.setItem("2faStep", "recovery-after-otp");
          if (data.data.trustLevel) {
            localStorage.setItem("2faTrustLevel", data.data.trustLevel);
          }
          localStorage.setItem("2faCanRequestApproval", String(data.data.canRequestAdminApproval ?? true));
          router.push("/login");
          return;
        }
        if (data.data?.nextStep === "admin-approval") {
          toast.success("درخواست تأیید ادمین لازم است");
          localStorage.setItem("2faCanRequestApproval", "true");
          router.push("/login");
          return;
        }
        toast.success("خوش آمدید!");
        if (data.data?.recoveryCodes) {
          localStorage.setItem("newRecoveryCodes", JSON.stringify(data.data.recoveryCodes));
        }
        router.push("/dashboard");
      } else {
        toast.error(data.message || "کد اشتباه است");
      }
    } catch {
      toast.error("خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      const deviceId = localStorage.getItem("deviceId");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, deviceId }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        toast.success("کد جدید ارسال شد");
        setTimer(120);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      } else {
        toast.error("خطا در ارسال مجدد کد");
      }
    } catch {
      toast.error("خطا در ارسال مجدد کد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تایید حساب کاربری</h2>
          <p className="text-gray-600 text-sm">
            کد ۶ رقمی به <span className="text-blue-600 font-medium">{identifier}</span> ارسال شد
          </p>
        </div>

        <form onSubmit={handleVerify}>
          <div className="flex justify-center gap-3 mb-8" dir="ltr" onPaste={handlePaste}>
            {otp.map((data, index) => (
              <input
                key={index}
                ref={(el) => (inputs.current[index] = el)}
                type="text"
                maxLength="1"
                className="w-14 h-14 text-center text-2xl font-bold text-gray-800 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={(e) => e.target.select()}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {loading ? "در حال بررسی..." : "تایید و ورود"}
          </button>
        </form>

        <div className="mt-6 text-center">
          {canResend ? (
            <button onClick={handleResendCode} disabled={loading} className="text-sm text-blue-600">
              ارسال مجدد کد
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              ارسال مجدد در {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
            </p>
          )}
        </div>

        <div className="mt-4 text-center">
          <button onClick={() => router.push("/login")} className="text-sm text-gray-500">
            تغییر شماره یا ایمیل
          </button>
        </div>
      </motion.div>
    </div>
  );
}
