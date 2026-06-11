// app/verify-otp/page.jsx - نسخه کاملاً ریسپانسیو برای موبایل
'use client';

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function VerifyOTP() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const identifier = searchParams.get("identifier");
  const purpose = searchParams.get("purpose") || "login";
  const inputs = useRef([]);

  useEffect(() => {
    if (!userId) {
      toast.error("اطلاعات ناقص است");
      router.push("/login");
    }
  }, [userId, router]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.value !== "" && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      const lastIndex = Math.min(pastedData.length - 1, 5);
      inputs.current[lastIndex]?.focus();
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
      const deviceInfo = JSON.parse(sessionStorage.getItem('deviceInfo') || '{}');
      const deviceFingerprint = sessionStorage.getItem('deviceFingerprint');
      const loginMethod = identifier?.includes('@') ? 'email' : 'phone';
      
      const fullDeviceInfo = {
        ...deviceInfo,
        fingerprint: deviceFingerprint,
        loginMethod
      };
      
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ 
          userId, 
          code, 
          deviceInfo: fullDeviceInfo,
          purpose,
          loginMethod
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("خوش آمدید!");
        router.push("/dashboard");
      } else if (data.requiresDeviceVerification) {
        toast.error("دستگاه جدید شناسایی شد. لطفاً دستگاه خود را تایید کنید.");
        router.push(`/verify-device?userId=${userId}&identifier=${encodeURIComponent(identifier)}`);
      } else {
        toast.error(data.error || "کد اشتباه است");
      }
    } catch (err) {
      toast.error("خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      const deviceFingerprint = sessionStorage.getItem('deviceFingerprint');
      
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ 
          email: identifier?.includes('@') ? identifier : undefined,
          phone: !identifier?.includes('@') ? identifier : undefined,
          deviceFingerprint,
          purpose: 'login'
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("کد جدید ارسال شد ✅");
        setTimer(120);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      } else {
        toast.error(data.error || "خطا در ارسال مجدد کد");
      }
    } catch (err) {
      toast.error("خطا در ارسال مجدد کد");
    } finally {
      setLoading(false);
    }
  };

  // تابع کمکی برای نمایش زمان
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 w-full max-w-md border border-white/20"
      >
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            تایید حساب کاربری
          </h2>
          <p className="text-gray-300 text-xs sm:text-sm">
            کد ۶ رقمی به <span className="text-blue-400 font-medium break-all">{identifier}</span> ارسال شد.
          </p>
        </div>

        <form onSubmit={handleVerify}>
          {/* OTP Inputs - ریسپانسیو برای موبایل */}
          <div 
            className="flex justify-center gap-2 sm:gap-3 mb-6 sm:mb-8" 
            style={{ direction: "ltr" }}
            onPaste={handlePaste}
          >
            {otp.map((data, index) => (
              <input
                key={index}
                ref={(el) => (inputs.current[index] = el)}
                type="text"
                maxLength="1"
                className="w-10 h-10 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold text-white bg-white/10 border-2 border-white/20 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                style={{ direction: "ltr" }}
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
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 sm:py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 text-sm sm:text-base"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                در حال بررسی...
              </div>
            ) : (
              "تایید و ورود"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          {canResend ? (
            <button
              onClick={handleResendCode}
              disabled={loading}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              ارسال مجدد کد
            </button>
          ) : (
            <p className="text-sm text-gray-400">
              ارسال مجدد کد در {formatTime(timer)}
            </p>
          )}
        </div>

        <div className="mt-4 text-center">
          <button 
            onClick={() => router.push("/login")}
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            تغییر شماره یا ایمیل
          </button>
        </div>
      </motion.div>
    </div>
  );
}