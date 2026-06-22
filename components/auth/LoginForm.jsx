"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
  ArrowRight,
  Loader2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthProvider";
import { useDeviceId } from "@/hooks/useDeviceId";
import {
  identifierSchema as sharedIdentifierSchema,
  getZodErrorMessage,
} from "@/lib/validators/auth.schema";

const identifierSchema = z.object({
  identifier: sharedIdentifierSchema,
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "کد تأیید باید ۶ رقم باشد")
    .regex(/^\d+$/, "کد تأیید باید عدد باشد"),
});

const recoverySchema = z.object({
  identifier: sharedIdentifierSchema,
  recoveryCode: z
    .string()
    .length(8, "کد بازیابی باید ۸ کاراکتر باشد")
    .regex(/^[A-Za-z0-9]+$/, "کد بازیابی نامعتبر است"),
});

const recoveryAfterOtpSchema = z.object({
  recoveryCode: z
    .string()
    .length(8, "کد بازیابی باید ۸ کاراکتر باشد")
    .regex(/^[A-Za-z0-9]+$/, "کد بازیابی نامعتبر است"),
});


export default function LoginForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { getDeviceId } = useDeviceId();

  const [step, setStep] = useState("identifier");
  const [mode, setMode] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [userIdentifier, setUserIdentifier] = useState("");
  const [verifyIdentifier, setVerifyIdentifier] = useState("");
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [verifyType, setVerifyType] = useState("email");
  const [trustLevel, setTrustLevel] = useState(null);
  const [canRequestAdminApproval, setCanRequestAdminApproval] = useState(false);
  const [approvalRequestId, setApprovalRequestId] = useState(null);
  const [approvalToken, setApprovalToken] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [approvalPolling, setApprovalPolling] = useState(false);
  const [formError, setFormError] = useState("");
  const [shakeIdentifier, setShakeIdentifier] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: { identifier: "", recoveryCode: "", otp: "" },
  });

  const otpValue = watch("otp");
  const identifierValue = watch("identifier");

  useEffect(() => {
    if (formError) setFormError("");
  }, [identifierValue]);

  function triggerIdentifierShake(message) {
    setFormError(message);
    setShakeIdentifier(true);
    window.setTimeout(() => setShakeIdentifier(false), 450);
  }

  useEffect(() => {
    const savedStep = localStorage.getItem("2faStep");
    const savedTrust = localStorage.getItem("2faTrustLevel");
    const savedIdentifier = localStorage.getItem("2faLoginIdentifier");
    const pendingApproval = localStorage.getItem("approvalRequestId");
    const pendingToken = localStorage.getItem("approvalToken");

    if (savedTrust) setTrustLevel(savedTrust);
    if (savedIdentifier) setUserIdentifier(savedIdentifier);

    if (pendingApproval && pendingToken) {
      setApprovalRequestId(pendingApproval);
      setApprovalToken(pendingToken);
      setStep("admin-approval-pending");
      setApprovalPolling(true);
      setCanRequestAdminApproval(true);
    } else if (savedStep === "recovery-after-otp" && localStorage.getItem("2faSessionId")) {
      setStep("recovery-after-otp");
      setCanRequestAdminApproval(
        localStorage.getItem("2faCanRequestApproval") === "true" || savedTrust === "LOW"
      );
    }
  }, []);

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (!approvalPolling || !approvalRequestId || !approvalToken) return;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/security/approval/${approvalRequestId}/status?token=${encodeURIComponent(approvalToken)}`
        );
        const result = await res.json();
        if (!res.ok) return;

        const status = result.data?.status;
        setApprovalStatus(status);

        if (status === "approved") {
          setApprovalPolling(false);
          await completeApprovedLogin();
        } else if (status === "denied" || status === "blocked") {
          setApprovalPolling(false);
          toast.error(status === "blocked" ? "درخواست رد و حساب مسدود شد" : "درخواست توسط ادمین رد شد");
        } else if (status === "expired") {
          setApprovalPolling(false);
          toast.error("درخواست منقضی شده است");
        }
      } catch {
        /* ignore polling errors */
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [approvalPolling, approvalRequestId, approvalToken]);

  function clearLoginSession() {
    localStorage.removeItem("2faSessionId");
    localStorage.removeItem("2faDeviceId");
    localStorage.removeItem("2faIdentifier");
    localStorage.removeItem("2faVerifyType");
    localStorage.removeItem("2faRequiresRecovery");
    localStorage.removeItem("2faCanRequestApproval");
    localStorage.removeItem("2faStep");
    localStorage.removeItem("2faTrustLevel");
    localStorage.removeItem("2faLoginIdentifier");
    localStorage.removeItem("approvalRequestId");
    localStorage.removeItem("approvalToken");
  }

  async function finishLogin(message) {
    toast.success(message);
    clearLoginSession();
    await refresh();
    router.push("/dashboard");
    router.refresh();
  }

  async function onSendIdentifier(data) {
    const parsed = identifierSchema.safeParse(data);
    if (!parsed.success) {
      triggerIdentifierShake(
        getZodErrorMessage(parsed.error, "لطفاً ایمیل یا شماره موبایل خود را وارد کنید")
      );
      return;
    }

    setFormError("");
    setLoading(true);
    try {
      const deviceId = await getDeviceId(parsed.data.identifier);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: parsed.data.identifier, deviceId }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.errors?.requiredAction === "ADMIN_APPROVAL") {
          toast.error(result.message || "ورود مسدود — در انتظار تأیید ادمین");
          return;
        }
        if (result.errors?.redirectTo === "/register") {
          toast.error("لطفاً ابتدا ثبت‌نام کنید");
          setTimeout(() => router.push("/register"), 1500);
          return;
        }
        throw new Error(result.message || "خطا در ارسال درخواست");
      }

      const responseData = result.data;

      if (responseData?.deviceId) {
        localStorage.setItem("deviceId", responseData.deviceId);
      }

      if (responseData?.requiredAction === "2FA") {
        setUserIdentifier(parsed.data.identifier);
        localStorage.setItem("2faLoginIdentifier", parsed.data.identifier);
        setTrustLevel(responseData.trustLevel);
        localStorage.setItem("2faTrustLevel", responseData.trustLevel || "");
        setVerifyType(responseData.verifyType || "email");
        setVerifyIdentifier(responseData.identifier || data.identifier);

        localStorage.setItem("2faSessionId", responseData.sessionId);
        localStorage.setItem("2faDeviceId", responseData.deviceId);
        localStorage.setItem("2faIdentifier", responseData.identifier || data.identifier);
        localStorage.setItem("2faVerifyType", responseData.verifyType || "email");
        localStorage.setItem(
          "2faRequiresRecovery",
          String(responseData.requiresRecoveryCode || false)
        );
        localStorage.setItem(
          "2faCanRequestApproval",
          String(responseData.canRequestAdminApproval || false)
        );

        setCanRequestAdminApproval(responseData.canRequestAdminApproval || false);

        toast.success(responseData.message || "کد تأیید ارسال شد");
        setStep("otp");
        setTimer(120);
        setCanResend(false);
        return;
      }

      if (responseData?.requiredAction === "NONE") {
        await finishLogin(result.message || "ورود موفق");
        return;
      }

      toast.error("خطا در پردازش درخواست");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(data) {
    const parsed = otpSchema.safeParse(data);
    if (!parsed.success) {
      toast.error(getZodErrorMessage(parsed.error));
      return;
    }
    setLoading(true);
    try {
      const sessionId = localStorage.getItem("2faSessionId");
      const identifier =
        localStorage.getItem("2faIdentifier") || verifyIdentifier || userIdentifier;
      const deviceId = localStorage.getItem("deviceId");
      const type = localStorage.getItem("2faVerifyType") || verifyType;

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          code: parsed.data.otp,
          sessionId,
          deviceId,
          type,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "کد اشتباه است");

      const responseData = result.data;

      if (responseData?.nextStep === "recovery" || responseData?.requiresRecoveryCode) {
        toast.success("کد تأیید شد — کد بازیابی را وارد کنید");
        localStorage.setItem("2faStep", "recovery-after-otp");
        setCanRequestAdminApproval(
          responseData.canRequestAdminApproval || responseData.trustLevel === "LOW" || trustLevel === "LOW"
        );
        setStep("recovery-after-otp");
        reset({ recoveryCode: "" });
        return;
      }

      if (responseData?.nextStep === "admin-approval" || responseData?.canRequestAdminApproval) {
        toast.success("کد تأیید شد — درخواست تأیید ادمین لازم است");
        setCanRequestAdminApproval(true);
        setStep("admin-approval-request");
        return;
      }

      if (responseData?.completed === false) {
        toast.success("مرحله تأیید شد — مرحله بعد را تکمیل کنید");
        return;
      }

      await finishLogin("ورود موفقیت‌آمیز بود!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onCompleteLoginWithRecovery(data) {
    const parsed = recoveryAfterOtpSchema.safeParse(data);
    if (!parsed.success) {
      toast.error(getZodErrorMessage(parsed.error));
      return;
    }
    setLoading(true);
    try {
      const sessionId = localStorage.getItem("2faSessionId");
      const deviceId = localStorage.getItem("deviceId");

      const res = await fetch("/api/auth/complete-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          recoveryCode: parsed.data.recoveryCode.toUpperCase(),
          deviceId,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      await finishLogin("ورود با OTP و کد بازیابی موفق بود");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onRequestAdminApproval() {
    setLoading(true);
    try {
      const sessionId = localStorage.getItem("2faSessionId");
      const deviceId = localStorage.getItem("deviceId") || localStorage.getItem("2faDeviceId");
      const identifier =
        localStorage.getItem("2faLoginIdentifier") ||
        localStorage.getItem("2faIdentifier") ||
        userIdentifier;
      const fromRecoveryStep = step === "recovery-after-otp";

      const res = await fetch("/api/security/approval/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twoFactorSessionId: sessionId,
          deviceId,
          identifier,
          trustLevel: trustLevel || localStorage.getItem("2faTrustLevel"),
          lostRecoveryCode: fromRecoveryStep,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "خطا در ثبت درخواست");

      const { requestId, approvalToken: token, status } = result.data;
      setApprovalRequestId(requestId);
      setApprovalToken(token);
      setApprovalStatus(status);
      localStorage.setItem("approvalRequestId", requestId);
      if (token) localStorage.setItem("approvalToken", token);

      setStep("admin-approval-pending");
      localStorage.removeItem("2faStep");
      setApprovalPolling(true);
      toast.success("درخواست تأیید ادمین ثبت شد");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function completeApprovedLogin() {
    setLoading(true);
    try {
      const requestId = approvalRequestId || localStorage.getItem("approvalRequestId");
      const token = approvalToken || localStorage.getItem("approvalToken");

      const res = await fetch(`/api/security/approval/${requestId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      await finishLogin("ورود با تأیید ادمین موفق بود");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onRecoveryLogin(data) {
    const parsed = recoverySchema.safeParse(data);
    if (!parsed.success) {
      const message = getZodErrorMessage(parsed.error);
      const isIdentifierIssue = parsed.error.issues.some((i) => i.path[0] === "identifier");
      if (isIdentifierIssue) {
        triggerIdentifierShake(message);
      } else {
        toast.error(message);
      }
      return;
    }
    setFormError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/recovery-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: parsed.data.identifier,
          code: parsed.data.recoveryCode.toUpperCase(),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || result.error || "کد بازیابی نامعتبر است");
      }

      await finishLogin("ورود با کد بازیابی موفقیت‌آمیز بود!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend || !userIdentifier) return;
    setLoading(true);
    try {
      const deviceId = await getDeviceId(userIdentifier);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: userIdentifier, deviceId }),
      });

      if (res.ok) {
        toast.success("کد جدید ارسال شد");
        setTimer(120);
        setCanResend(false);
        reset({ otp: "" });
      } else {
        toast.error("خطا در ارسال مجدد کد");
      }
    } catch {
      toast.error("خطا در ارسال مجدد کد");
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(mode === "normal" ? "recovery" : "normal");
    setStep("identifier");
    setFormError("");
    reset({ identifier: "", recoveryCode: "", otp: "" });
  }

  function handleBack() {
    setStep("identifier");
    setFormError("");
    reset({ identifier: userIdentifier || "" });
  }

  const trustInfo = {
    HIGH: { label: "بالا", color: "text-green-600", bg: "bg-green-100" },
    MEDIUM: { label: "متوسط", color: "text-yellow-600", bg: "bg-yellow-100" },
    LOW: { label: "پایین", color: "text-red-600", bg: "bg-red-100" },
    CRITICAL: { label: "بحرانی", color: "text-red-600", bg: "bg-red-100" },
  }[trustLevel] || { label: "متوسط", color: "text-yellow-600", bg: "bg-yellow-100" };

  const showAdminApprovalFallback =
    step === "recovery-after-otp" && (canRequestAdminApproval || trustLevel === "LOW");

  const isRecoveryMode = mode === "recovery";
  const isAdminApprovalStep = step === "admin-approval-request" || step === "admin-approval-pending";
  const onSubmit =
    step === "recovery-after-otp"
      ? onCompleteLoginWithRecovery
      : step === "otp"
        ? onVerifyOtp
        : isRecoveryMode
          ? onRecoveryLogin
          : onSendIdentifier;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-auto border border-gray-100"
    >
      <div className="text-center mb-6 sm:mb-8">
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${
            isRecoveryMode
              ? "bg-gradient-to-br from-amber-500 to-orange-600"
              : "bg-gradient-to-br from-blue-600 to-indigo-600"
          }`}
        >
          {isRecoveryMode ? (
            <Key size={26} className="text-white" />
          ) : (
            <Shield size={26} className="text-white" />
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {isRecoveryMode ? "بازیابی حساب" : "خوش آمدید"}
        </h1>
        <p className="text-gray-500 text-sm px-2">
          {isRecoveryMode
            ? "با کد بازیابی وارد حساب خود شوید"
            : step === "identifier"
              ? "ایمیل یا شماره موبایل خود را وارد کنید"
              : step === "recovery-after-otp"
                ? "کد بازیابی ۸ کاراکتری را وارد کنید"
                : step === "admin-approval-request"
                  ? "کد بازیابی ندارید — درخواست تأیید ادمین دهید"
                  : step === "admin-approval-pending"
                    ? "در انتظار تأیید ادمین..."
                    : `کد ۶ رقمی به ${verifyIdentifier || userIdentifier} ارسال شد`}
        </p>
      </div>

      {!isRecoveryMode && (step === "otp" || step === "recovery-after-otp") && trustLevel && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-6 ${trustInfo.bg}`}>
          <Shield size={16} className={trustInfo.color} />
          <span className={`text-sm font-medium ${trustInfo.color}`}>
            سطح امنیت: {trustInfo.label}
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${mode}-${step}`}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {(step === "identifier" || isRecoveryMode) && (
              <motion.div
                animate={shakeIdentifier ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className={shakeIdentifier ? "animate-shake" : ""}
              >
                <Input
                  {...register("identifier")}
                  label="ایمیل یا شماره تماس"
                  placeholder="example@gmail.com یا 09123456789"
                  dir="ltr"
                  autoComplete="username"
                  error={formError || errors.identifier?.message}
                  className="text-left"
                  startIcon={
                    identifierValue?.includes("@") ? (
                      <Mail size={18} aria-hidden />
                    ) : (
                      <Phone size={18} aria-hidden />
                    )
                  }
                  aria-invalid={Boolean(formError || errors.identifier)}
                />
              </motion.div>
            )}

            {step === "otp" && !isRecoveryMode && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                  کد تأیید ۶ رقمی
                </label>
                <div className="flex justify-center gap-2 sm:gap-3" dir="ltr">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-colors"
                      value={otpValue?.[index] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!/^\d*$/.test(val)) return;
                        const next = (otpValue || "").split("");
                        next[index] = val;
                        setValue("otp", next.join(""), { shouldValidate: true });
                        if (val && index < 5) {
                          document.querySelector(`input[data-otp="${index + 1}"]`)?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otpValue?.[index] && index > 0) {
                          document.querySelector(`input[data-otp="${index - 1}"]`)?.focus();
                        }
                      }}
                      data-otp={index}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                {errors.otp && (
                  <p className="text-red-500 text-xs mt-2 text-center">{errors.otp.message}</p>
                )}
              </div>
            )}

            {(isRecoveryMode || step === "recovery-after-otp") && step !== "admin-approval-pending" && (
              <>
                {step === "recovery-after-otp" && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                    سطح اعتماد پایین — OTP تأیید شد. کد بازیابی ۸ کاراکتری را وارد کنید.
                  </div>
                )}
                <Input
                  {...register("recoveryCode")}
                  label="کد بازیابی (۸ کاراکتر)"
                  placeholder="A1B2C3D4"
                  dir="ltr"
                  error={errors.recoveryCode?.message}
                  className="font-mono tracking-wider"
                />

                {showAdminApprovalFallback && (
                  <div className="space-y-3 pt-1">
                    <div className="relative flex items-center gap-3">
                      <div className="flex-1 border-t border-gray-200" />
                      <span className="text-xs text-gray-400 shrink-0">یا</span>
                      <div className="flex-1 border-t border-gray-200" />
                    </div>
                    <button
                      type="button"
                      onClick={onRequestAdminApproval}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl py-3.5 hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Shield size={16} />
                      درخواست تأیید ادمین
                    </button>
                    <p className="text-xs text-center text-gray-500 leading-relaxed">
                      کد بازیابی را گم کرده‌اید؟ درخواست شما به تیم امنیت ارسال می‌شود.
                    </p>
                  </div>
                )}
              </>
            )}

            {step === "admin-approval-request" && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
                  سطح اعتماد پایین است و کد بازیابی ثبت‌شده‌ای ندارید. برای ادامه ورود، درخواست
                  تأیید ادمین ارسال کنید.
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onClick={onRequestAdminApproval}
                >
                  درخواست تأیید ادمین
                </Button>
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
                >
                  بازگشت
                </button>
              </div>
            )}

            {step === "admin-approval-pending" && (
              <div className="space-y-5 text-center py-6">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield size={28} className="text-amber-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">در انتظار تأیید ادمین</h3>
                  <p className="text-sm text-gray-600 leading-relaxed px-2">
                    درخواست شما به تیم امنیت ارسال شد. لطفاً منتظر بمانید.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Your request has been sent to the security team. Please wait.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-full text-sm text-amber-800">
                  <Loader2 size={14} className="animate-spin" />
                  وضعیت:{" "}
                  {approvalStatus === "pending"
                    ? "در انتظار بررسی"
                    : approvalStatus === "approved"
                      ? "تأیید شد"
                      : approvalStatus || "در حال بررسی..."}
                </div>
                {approvalStatus === "approved" && (
                  <Button
                    type="button"
                    variant="primary"
                    fullWidth
                    loading={loading}
                    onClick={completeApprovedLogin}
                  >
                    ادامه ورود
                  </Button>
                )}
              </div>
            )}

            {step === "otp" && !isRecoveryMode && (
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={handleBack} className="text-gray-500 flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors">
                  <ArrowLeft size={14} />
                  بازگشت
                </button>
                {timer > 0 ? (
                  <span className="text-gray-500">
                    ارسال مجدد {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
                  </span>
                ) : (
                  <button type="button" onClick={handleResend} disabled={loading} className="text-blue-600 hover:text-blue-700 cursor-pointer disabled:cursor-not-allowed transition-colors">
                    ارسال مجدد
                  </button>
                )}
              </div>
            )}

            {!isAdminApprovalStep && step !== "admin-approval-pending" && (
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="hover:shadow-xl hover:shadow-blue-200/60"
              >
                {step === "recovery-after-otp" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Key size={18} /> تکمیل ورود
                  </span>
                ) : step === "otp" ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> تأیید و ورود
                  </span>
                ) : isRecoveryMode ? (
                  <span className="flex items-center justify-center gap-2">
                    <Key size={18} /> ورود با کد بازیابی
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    ارسال کد تأیید
                    <ArrowRight size={18} className="rotate-180" />
                  </span>
                )}
              </Button>
            )}

            {step === "identifier" && !isRecoveryMode && (
              <div className="flex flex-col items-center gap-3 text-sm">
                <button type="button" onClick={toggleMode} className="text-amber-600 flex items-center gap-1 cursor-pointer hover:text-amber-700 transition-colors">
                  <Key size={14} /> ورود با کد بازیابی
                </button>
                <p className="text-gray-500">
                  حساب ندارید؟{" "}
                  <a href="/register" className="text-blue-600 font-semibold hover:underline cursor-pointer">
                    ثبت‌نام
                  </a>
                </p>
              </div>
            )}

            {isRecoveryMode && (
              <button type="button" onClick={toggleMode} className="text-sm text-blue-600 w-full text-center cursor-pointer hover:text-blue-700 transition-colors">
                ← بازگشت به ورود عادی
              </button>
            )}
          </form>
        </motion.div>
      </AnimatePresence>

      {step === "otp" && (
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <Lock size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              در محیط توسعه، کد OTP در ترمینال سرور نمایش داده می‌شود.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
