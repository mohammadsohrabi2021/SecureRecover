"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function Verify2FAContent() {
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

    if (!storedSessionId) {
      toast.error("جلسه معتبر نیست");
      router.push("/login");
      return;
    }

    setSessionId(storedSessionId);
    setRequiresEmail(storedRequiresEmail);
    setRequiresPhone(storedRequiresPhone);

    if (storedRequiresEmail) setStep("email");
    else if (storedRequiresPhone) setStep("phone");
  }, [urlSessionId, router]);

  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
    if (timer === 0) setCanResend(true);
  }, [timer, canResend]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error("لطفاً کد ۶ رقمی را کامل وارد کنید");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, type: step, code }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      const responseData = result.data;

      if (responseData?.nextStep === "recovery") {
        toast.success("OTP تأیید شد — کد بازیابی را وارد کنید");
        router.push("/login");
        return;
      }

      if (responseData?.completed === true) {
        toast.success("تأیید هویت کامل شد!");
        localStorage.removeItem("2faSessionId");
        window.location.href = "/dashboard";
        return;
      }

      if (responseData?.completed === false && responseData?.nextStep) {
        toast.success("کد تأیید شد");
        setCode("");
        setStep(responseData.nextStep);
        return;
      }

      toast.error("خطا در پردازش درخواست");
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
      const res = await fetch("/api/auth/resend-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, type: step }),
      });
      if (res.ok) {
        toast.success("کد جدید ارسال شد");
        setTimer(120);
        setCanResend(false);
      }
    } catch {
      toast.error("خطا در ارسال مجدد");
    } finally {
      setLoading(false);
    }
  };

  const getStepMessage = () => {
    if (step === "email") {
      return requiresEmail && requiresPhone
        ? "مرحله 1: کد تأیید ایمیل"
        : "کد تأیید ۶ رقمی ایمیل";
    }
    if (step === "phone") {
      return requiresEmail && requiresPhone
        ? "مرحله 2: کد تأیید تلفن"
        : "کد تأیید ۶ رقمی تلفن";
    }
    return "";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تأیید هویت</h2>
          <p className="text-gray-500 text-sm">{getStepMessage()}</p>
        </div>

        <div className="space-y-6">
          <Input
            label={`کد ${step === "email" ? "ایمیل" : "تلفن"} (۶ رقم)`}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            dir="ltr"
          />

          <Button variant="primary" size="lg" fullWidth onClick={handleVerify} loading={loading}>
            تأیید
          </Button>

          <div className="text-center">
            {canResend ? (
              <button onClick={handleResend} className="text-sm text-blue-600 hover:underline">
                ارسال مجدد کد
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                ارسال مجدد در {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
