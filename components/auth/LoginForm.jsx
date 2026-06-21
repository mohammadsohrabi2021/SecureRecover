"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { 
  Mail, 
  Phone, 
  Shield, 
  Key, 
  ArrowLeft, 
  CheckCircle,
  Lock,
  ArrowRight
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const identifierSchema = z.object({
  identifier: z
    .string()
    .min(1, "لطفاً ایمیل یا شماره موبایل را وارد کنید")
    .refine(
      (val) => val.includes("@") || /^09[0-9]{9}$/.test(val),
      "فرمت ایمیل یا شماره تلفن نامعتبر است"
    )
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "کد تأیید باید ۶ رقم باشد")
    .regex(/^\d+$/, "کد تأیید باید عدد باشد")
});

const recoverySchema = z.object({
  identifier: z
    .string()
    .min(1, "لطفاً ایمیل یا شماره موبایل را وارد کنید"),
  recoveryCode: z
    .string()
    .length(8, "کد بازیابی باید ۸ کاراکتر باشد")
    .regex(/^[A-Za-z0-9]+$/, "کد بازیابی باید شامل حروف و اعداد باشد")
});

export default function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState("identifier");
  const [mode, setMode] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [userIdentifier, setUserIdentifier] = useState("");
  const [verifyIdentifier, setVerifyIdentifier] = useState("");
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [trustLevel, setTrustLevel] = useState(null);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    getValues
  } = useForm({
    defaultValues: {
      identifier: "",
      recoveryCode: "",
      otp: ""
    },
    resolver: zodResolver(
      step === "identifier" ? identifierSchema :
      step === "otp" ? otpSchema :
      recoverySchema
    )
  });

  const otpValue = watch("otp");
  const recoveryCodeValue = watch("recoveryCode");

  const generateNewDeviceId = () => {
    try {
      const userAgent = navigator.userAgent || '';
      const language = navigator.language || 'en-US';
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const screen = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
      
      const fingerprint = `${userAgent}|${language}|${timezone}|${screen}`;
      
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
      const timestamp = Date.now().toString(36);
      return `${hashHex}_${timestamp.substring(timestamp.length - 6)}`;
    } catch {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 10);
      return `${timestamp}_${random}`;
    }
  };

  const getDeviceId = async (identifier) => {
    let deviceId = localStorage.getItem("deviceId");
    
    if (deviceId) {
      console.log("♻️ DeviceId found in localStorage:", deviceId);
      return deviceId;
    }
    
    try {
      console.log("🔍 Checking deviceId in database for:", identifier);
      
      const res = await fetch("/api/auth/check-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
      });
      
      const data = await res.json();
     
      if (res.ok && data.deviceId) {
        deviceId = data.deviceId;
        localStorage.setItem("deviceId", deviceId);
        console.log(data,'data')
        console.log("✅ DeviceId loaded from database:", deviceId);
        return deviceId;
      }
      
      deviceId = generateNewDeviceId();
      localStorage.setItem("deviceId", deviceId);
      
      await fetch("/api/auth/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          deviceId,
          deviceName: "New Device",
          deviceType: "unknown",
          browser: navigator.userAgent?.split(" ")[0] || "Unknown",
          os: "Unknown",
          userAgent: navigator.userAgent || "Unknown"
        })
      });
      
      console.log("🆕 New deviceId generated and saved:", deviceId);
      return deviceId;
      
    } catch (error) {
      console.warn("⚠️ Could not fetch deviceId from database:", error);
      deviceId = generateNewDeviceId();
      localStorage.setItem("deviceId", deviceId);
      console.log("🆕 New deviceId generated (fallback):", deviceId);
      return deviceId;
    }
  };

  useEffect(() => {
    console.log("🔄 Watch recoveryCode changed:", recoveryCodeValue);
  }, [recoveryCodeValue]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  async function onSendIdentifier(data) {
    setLoading(true);
    setError("");
    
    try {
      const deviceId = await getDeviceId(data.identifier);
      console.log("🔑 Final deviceId:", deviceId);
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          identifier: data.identifier,
          deviceId: deviceId
        })
      });
      
      const result = await res.json();
      console.log("Login response:", result);
      
      if (!res.ok) {
        throw new Error(result.message || "خطا در ارسال درخواست");
      }
      
      const responseData = result.data;
      
      if (responseData.deviceId) {
        localStorage.setItem("deviceId", responseData.deviceId);
        console.log("✅ DeviceId saved from server:", responseData.deviceId);
      }
      
      if (responseData?.requiredAction === "REGISTER_FIRST") {
        toast.error("این ایمیل یا شماره تلفن ثبت نام نشده است. لطفاً ابتدا ثبت نام کنید.");
        setTimeout(() => router.push("/register"), 2000);
        return;
      }
      
      if (responseData?.requiredAction === "2FA") {
        setUserIdentifier(data.identifier);
        setTrustLevel(responseData.trustLevel);
        
        const correctIdentifier = responseData.identifier || data.identifier;
        setVerifyIdentifier(correctIdentifier);
        
        localStorage.setItem("2faSessionId", responseData.sessionId);
        localStorage.setItem("2faDeviceId", responseData.deviceId);
        localStorage.setItem("2faRequiresEmail", responseData.requiresEmail);
        localStorage.setItem("2faRequiresPhone", responseData.requiresPhone);
        localStorage.setItem("2faIdentifier", correctIdentifier);
        
        if (responseData.requiresEmail && responseData.requiresPhone) {
          toast.success("کد تأیید به ایمیل و شماره تلفن شما ارسال شد");
        } else if (responseData.requiresEmail) {
          toast.success("کد تأیید ۶ رقمی به ایمیل شما ارسال شد");
        } else if (responseData.requiresPhone) {
          toast.success("کد تأیید ۶ رقمی به شماره تلفن شما ارسال شد");
        }
        
        setStep("otp");
        setTimer(120);
        setCanResend(false);
        return;
      }
      
      if (responseData?.requiredAction === "NONE") {
        toast.success(responseData.message || "ورود موفق");
        router.push("/dashboard");
        return;
      }
      
      toast.error("خطا در پردازش درخواست");
      
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(data) {
    setLoading(true);
    setError("");
    
    try {
      const sessionId = localStorage.getItem("2faSessionId");
      const identifier = localStorage.getItem("2faIdentifier") || verifyIdentifier || userIdentifier;
      const deviceId = localStorage.getItem("deviceId");
      
      console.log("🔍 Verifying OTP with identifier:", identifier);
      console.log("🔑 Verifying with deviceId:", deviceId);
      
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier,
          code: data.otp,
          sessionId: sessionId,
          deviceId: deviceId
        })
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.message || "کد اشتباه است");
      }
      
      toast.success("ورود موفقیت‌آمیز بود! خوش آمدید.");
      
      localStorage.removeItem("2faSessionId");
      localStorage.removeItem("2faDeviceId");
      localStorage.removeItem("2faRequiresEmail");
      localStorage.removeItem("2faRequiresPhone");
      localStorage.removeItem("2faIdentifier");
      
      router.push("/dashboard");
      
    } catch (err) {
      console.error("Verify error:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onRecoveryLogin(data) {
    console.log("=========================================");
    console.log("🔐 RECOVERY LOGIN STARTED");
    console.log("📝 Full form data:", data);
    console.log("📝 Identifier from data:", data.identifier);
    console.log("📝 Recovery code from data:", data.recoveryCode);
    
    const identifierFromForm = getValues("identifier");
    const recoveryCodeFromForm = getValues("recoveryCode");
    
    console.log("📝 Identifier from getValues:", identifierFromForm);
    console.log("📝 Recovery code from getValues:", recoveryCodeFromForm);
    
    const finalIdentifier = data.identifier || identifierFromForm;
    const finalRecoveryCode = data.recoveryCode || recoveryCodeFromForm;
    
    console.log("📝 Final identifier:", finalIdentifier);
    console.log("📝 Final recovery code:", finalRecoveryCode);
    console.log("=========================================");
    
    setLoading(true);
    setError("");
    
    try {
      if (!finalRecoveryCode) {
        console.log("❌ Recovery code is undefined or empty!");
        throw new Error("لطفاً کد بازیابی را وارد کنید");
      }
      
      const payload = {
        identifier: finalIdentifier,
        code: finalRecoveryCode.toUpperCase()
      };
      
      console.log("📤 Sending payload:", payload);
      
      const res = await fetch("/api/auth/recovery-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      console.log("📥 Response:", result);
      
      if (!res.ok) {
        throw new Error(result.message || result.error || "کد بازیابی نامعتبر است");
      }
      
      toast.success("ورود با کد بازیابی موفقیت‌آمیز بود!");
      router.push("/dashboard");
      
    } catch (err) {
      console.error("❌ Recovery login error:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;
    
    setLoading(true);
    try {
      const deviceId = await getDeviceId(userIdentifier);
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          identifier: userIdentifier,
          deviceId: deviceId
        })
      });
      
      if (res.ok) {
        toast.success("کد جدید ارسال شد");
        setTimer(120);
        setCanResend(false);
        reset({ otp: "" });
      } else {
        toast.error("خطا در ارسال مجدد کد");
      }
    } catch (error) {
      toast.error("خطا در ارسال مجدد کد");
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setStep("identifier");
    setError("");
    reset({ identifier: "" });
  }

  function toggleMode() {
    console.log("🔄 Toggling mode from:", mode);
    setMode(mode === "normal" ? "recovery" : "normal");
    setStep("identifier");
    setError("");
    reset({ 
      identifier: "", 
      recoveryCode: "",
      otp: "" 
    });
    console.log("🔄 Mode toggled to:", mode === "normal" ? "recovery" : "normal");
  }

  const getTrustLevelInfo = () => {
    const levels = {
      HIGH: { label: "بالا", color: "text-green-600", bg: "bg-green-100" },
      MEDIUM: { label: "متوسط", color: "text-yellow-600", bg: "bg-yellow-100" },
      LOW: { label: "پایین", color: "text-orange-600", bg: "bg-orange-100" },
      CRITICAL: { label: "بحرانی", color: "text-red-600", bg: "bg-red-100" }
    };
    return levels[trustLevel] || levels.MEDIUM;
  };

  const isRecoveryMode = mode === "recovery";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-auto border border-gray-100"
    >
      <div className="text-center mb-8">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${
          isRecoveryMode 
            ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-200" 
            : "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-200"
        }`}>
          {isRecoveryMode ? (
            <Key size={28} className="text-white" />
          ) : (
            <Shield size={28} className="text-white" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isRecoveryMode ? "بازیابی حساب" : "خوش آمدید"}
        </h1>
        <p className="text-gray-500 text-sm">
          {isRecoveryMode 
            ? "با استفاده از کد بازیابی وارد حساب خود شوید"
            : step === "identifier" 
              ? "لطفاً ایمیل یا شماره موبایل خود را وارد کنید"
              : `کد ۶ رقمی به ${userIdentifier} ارسال شد`
          }
        </p>
      </div>

      {!isRecoveryMode && step === "otp" && trustLevel && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-6 ${getTrustLevelInfo().bg}`}
        >
          <Shield size={16} className={getTrustLevelInfo().color} />
          <span className={`text-sm font-medium ${getTrustLevelInfo().color}`}>
            سطح امنیت: {getTrustLevelInfo().label}
          </span>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {isRecoveryMode ? (
          <motion.div
            key="recovery-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSubmit(onRecoveryLogin)} className="space-y-5">
              <Input
                {...register("identifier")}
                label="پست الکترونیک یا شماره تماس"
                placeholder="example@gmail.com یا 09123456789"
                dir="ltr"
                error={errors.identifier?.message}
              />

              <Input
                {...register("recoveryCode")}
                label="کد بازیابی (۸ کاراکتر)"
                placeholder="A1B2C3D4"
                dir="ltr"
                error={errors.recoveryCode?.message}
                className="font-mono tracking-wider"
              />

              <div className="text-xs text-gray-400 text-center">
                مقدار کد: {watch("recoveryCode") || "خالی"}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="cursor-pointer"
              >
                <span className="flex items-center justify-center gap-2">
                  <Key size={18} />
                  ورود با کد بازیابی
                </span>
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-blue-600 cursor-pointer hover:text-blue-700 font-medium transition-colors"
                >
                  ← بازگشت به ورود عادی
                </button>
              </div>
            </form>
          </motion.div>
        ) : step === "identifier" ? (
          <motion.div
            key="identifier-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSubmit(onSendIdentifier)} className="space-y-5">
              <div className="relative">
                <Input
                  {...register("identifier")}
                  label="پست الکترونیک یا شماره تماس"
                  placeholder="example@gmail.com یا 09123456789"
                  dir="ltr"
                  error={errors.identifier?.message}
                  className="pl-12"
                />
                <div className="absolute left-3 top-11 text-gray-400">
                  {watch("identifier")?.includes("@") ? (
                    <Mail size={18} />
                  ) : (
                    <Phone size={18} />
                  )}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="cursor-pointer"
              >
                <span className="flex items-center justify-center gap-2">
                  ارسال کد تایید
                  <ArrowRight size={18} className="rotate-180" />
                </span>
              </Button>

              <div className="flex flex-col items-center space-y-3 mt-4 text-sm">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-amber-600 cursor-pointer hover:text-amber-700 font-medium transition-colors flex items-center gap-1"
                >
                  <Key size={14} />
                  ورود با کد بازیابی
                </button>

                <p className="text-gray-500">
                  حساب کاربری ندارید؟{" "}
                  <a href="/register" className="text-blue-600 font-semibold hover:underline">
                    ثبت‌نام رایگان
                  </a>
                </p>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="otp-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSubmit(onVerifyOtp)} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                  کد تأیید ۶ رقمی
                </label>
                
                <div className="flex justify-center gap-3" dir="ltr">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      className="w-12 h-14 text-center text-2xl font-bold text-gray-800 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                      value={otpValue?.[index] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!/^\d*$/.test(val)) return;
                        const newOtp = (otpValue || "").split("");
                        newOtp[index] = val;
                        setValue("otp", newOtp.join(""));
                        if (val && index < 5) {
                          document.querySelector(`input[data-index="${index + 1}"]`)?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otpValue?.[index] && index > 0) {
                          document.querySelector(`input[data-index="${index - 1}"]`)?.focus();
                        }
                      }}
                      data-index={index}
                      autoFocus={index === 0}
                      dir="ltr"
                    />
                  ))}
                </div>
                {errors.otp && (
                  <p className="text-red-500 text-xs mt-2 text-center">
                    {errors.otp.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft size={14} />
                  بازگشت
                </button>
                <div className="flex items-center gap-2">
                  {timer > 0 ? (
                    <span className="text-gray-500">
                      ارسال مجدد در {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={!canResend || loading}
                      className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 transition-colors"
                    >
                      ارسال مجدد کد
                    </button>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="cursor-pointer"
              >
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle size={18} />
                  تأیید و ورود
                </span>
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-amber-600 cursor-pointer hover:text-amber-700 font-medium transition-colors flex items-center gap-1 mx-auto text-sm"
                >
                  <Key size={14} />
                  ورود با کد بازیابی
                </button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <Lock size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs text-blue-800 font-medium">نکته امنیتی</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    کد تأیید در ترمینال سرور نمایش داده می‌شود. هرگز کد را با کسی به اشتراک نگذارید.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-center text-xs text-gray-400">
          🔐 سیستم احراز هویت هوشمند SecureRecover
        </p>
      </div>
    </motion.div>
  );
}