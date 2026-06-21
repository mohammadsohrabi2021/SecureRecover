// components/auth/TwoFactorForm.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function TwoFactorForm({ identifier, onSuccess }) {
  const [step, setStep] = useState("email"); // email, phone
  const [sessionId, setSessionId] = useState(null);
  const [requiresEmail, setRequiresEmail] = useState(false);
  const [requiresPhone, setRequiresPhone] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  
  useEffect(() => {
    // شروع فرآیند 2FA
    start2FA();
  }, []);
  
  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, canResend]);
  
  const start2FA = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);
      
      setSessionId(data.data.sessionId);
      setRequiresEmail(data.data.requiresEmail);
      setRequiresPhone(data.data.requiresPhone);
      
      if (data.data.requiresEmail && !data.data.requiresPhone) {
        setStep("email");
      } else if (!data.data.requiresEmail && data.data.requiresPhone) {
        setStep("phone");
      } else {
        setStep("email");
      }
      
      toast.info(data.data.message);
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerify = async (type) => {
    if (code.length !== 6) {
      toast.error("لطفاً کد ۶ رقمی را کامل وارد کنید");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, type, code })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);
      
      if (data.data.completed) {
        toast.success("تأیید هویت کامل شد! خوش آمدید.");
        if (onSuccess) onSuccess(data.data.user);
        // هدایت به داشبورد
        window.location.href = "/dashboard";
      } else {
        toast.success("کد تأیید شد");
        setCode("");
        setStep(data.data.nextStep === "email" ? "email" : "phone");
      }
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleResend = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-2fa-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, type: step })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("کد جدید ارسال شد");
        setTimer(120);
        setCanResend(false);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("خطا در ارسال مجدد کد");
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !sessionId) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-500">در حال آماده‌سازی...</p>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🔐</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          تأیید هویت دو مرحله‌ای
        </h2>
        <p className="text-gray-500 text-sm">
          {step === "email" 
            ? "کد تأیید به ایمیل شما ارسال شده است"
            : "کد تأیید به شماره تلفن شما ارسال شده است"}
        </p>
      </div>
      
      <div className="space-y-6">
        <Input
          label={`کد تأیید ${step === "email" ? "ایمیل" : "تلفن"} (۶ رقم)`}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          dir="ltr"
        />
        
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => handleVerify(step)}
          loading={loading}
        >
          تأیید کد
        </Button>
        
        <div className="text-center">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-sm text-blue-600 hover:underline"
            >
              ارسال مجدد کد
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              ارسال مجدد کد در {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
            </p>
          )}
        </div>
        
        <div className="text-center text-xs text-gray-400">
          <p>✅ کدهای تأیید در ترمینال سرور نمایش داده می‌شوند</p>
          <p className="mt-1">🔐 برای امنیت بیشتر، ایمیل و شماره تلفن شما تأیید می‌شوند</p>
        </div>
      </div>
    </motion.div>
  );
}