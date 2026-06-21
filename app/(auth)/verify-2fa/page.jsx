"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function Verify2FAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get("sessionId");
  
  const [step, setStep] = useState("email");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [requiresEmail, setRequiresEmail] = useState(false);
  const [requiresPhone, setRequiresPhone] = useState(false);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  
  useEffect(() => {
    const storedSessionId = urlSessionId || localStorage.getItem("2faSessionId");
    const storedRequiresEmail = localStorage.getItem("2faRequiresEmail") === "true";
    const storedRequiresPhone = localStorage.getItem("2faRequiresPhone") === "true";
    
    console.log("🔐 2FA Page init:", { 
      urlSessionId, 
      storedSessionId, 
      storedRequiresEmail, 
      storedRequiresPhone 
    });
    
    if (!storedSessionId) {
      toast.error("جلسه معتبر نیست");
      router.push("/login");
      return;
    }
    
    setSessionId(storedSessionId);
    setRequiresEmail(storedRequiresEmail);
    setRequiresPhone(storedRequiresPhone);
    
    if (storedRequiresEmail) {
      setStep("email");
      console.log("📧 Starting with email step");
    } else if (storedRequiresPhone) {
      setStep("phone");
      console.log("📱 Starting with phone step");
    }
  }, [urlSessionId, router]);
  
  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, canResend]);
  
  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error("لطفاً کد ۶ رقمی را کامل وارد کنید");
      return;
    }
    
    setLoading(true);
    try {
      console.log("🔐 Sending verification request:", { 
        sessionId, 
        type: step, 
        code,
        url: "/api/auth/verify-2fa"
      });
      
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          type: step,
          code
        })
      });
      
      console.log("📦 Response status:", res.status);
      
      const result = await res.json();
      console.log("📦 Full response:", JSON.stringify(result, null, 2));
      
      if (!res.ok) {
        throw new Error(result.message);
      }
      
      const responseData = result.data;
      console.log("📦 Response data:", responseData);
      
      // ✅ بررسی کامل شده
      if (responseData?.completed === true) {
        console.log("✅ 2FA COMPLETED! Redirecting to dashboard...");
        toast.success("تأیید هویت کامل شد! خوش آمدید.");
        
        localStorage.removeItem("2faSessionId");
        localStorage.removeItem("2faDeviceId");
        localStorage.removeItem("2faRequiresEmail");
        localStorage.removeItem("2faRequiresPhone");
        
        // هدایت به داشبورد
        window.location.href = "/dashboard";
        return;
      }
      
      // ✅ بررسی partial (مرحله بعد)
      if (responseData?.completed === false && responseData?.nextStep) {
        console.log("⏳ Moving to next step:", responseData.nextStep);
        toast.success("کد تأیید شد");
        setCode("");
        
        if (responseData.nextStep === "phone") {
          setStep("phone");
          toast.success("کد تأیید به شماره تلفن شما ارسال شد", { icon: "📱" });
          console.log("📱 Switched to phone step");
        } else if (responseData.nextStep === "email") {
          setStep("email");
          toast.success("کد تأیید به ایمیل شما ارسال شد", { icon: "📧" });
          console.log("📧 Switched to email step");
        }
        return;
      }
      
      // اگر هیچکدام نبود
      console.log("❌ Unknown response state:", responseData);
      toast.error("خطا در پردازش درخواست");
      
    } catch (err) {
      console.error("❌ Verify error:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleResend = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      console.log("📨 Resending code for step:", step);
      
      const res = await fetch("/api/auth/resend-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          type: step
        })
      });
      
      const result = await res.json();
      console.log("📨 Resend response:", result);
      
      if (res.ok) {
        toast.success("کد جدید ارسال شد");
        setTimer(120);
        setCanResend(false);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error("❌ Resend error:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const getStepMessage = () => {
    if (step === "email") {
      if (requiresEmail && requiresPhone) {
        return "مرحله 1 از 2: کد تأیید به ایمیل شما ارسال شده است";
      }
      return "کد تأیید ۶ رقمی به ایمیل شما ارسال شده است";
    }
    if (step === "phone") {
      if (requiresEmail && requiresPhone) {
        return "مرحله 2 از 2: کد تأیید به شماره تلفن شما ارسال شده است";
      }
      return "کد تأیید ۶ رقمی به شماره تلفن شما ارسال شده است";
    }
    return "";
  };
  
  console.log("🎨 Current UI state:", { step, sessionId, codeLength: code.length, loading });
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            تأیید هویت دو مرحله‌ای
          </h2>
          <p className="text-gray-500 text-sm">{getStepMessage()}</p>
          <p className="text-xs text-gray-400 mt-2">
            کد را در ترمینال سرور مشاهده کنید
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
            onClick={handleVerify}
            loading={loading}
          >
            {step === "email" ? "تأیید کد ایمیل" : "تأیید کد تلفن"}
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
    </div>
  );
}