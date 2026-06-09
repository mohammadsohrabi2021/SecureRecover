// import LoginForm from "@/components/auth/LoginForm";

// export default function LoginPage() {
//   return (
//     <div className="relative min-h-screen flex items-center justify-center bg-[#f8fafc] overflow-hidden">
      
//       {/* دایره‌های تزئینی پس‌زمینه برای حس مدرن بودن */}
//       <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px]" />
//       <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px]" />

//       <div className="w-full max-w-120 px-6 relative z-10">
//         <LoginForm />
//       </div>
//     </div>
//   );
// }
// app/login/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { collectDeviceInfo, getDeviceFingerprint } from '@/lib/device-fingerprint';

const identifierSchema = z.object({
  identifier: z.string().min(1, "لطفاً ایمیل یا شماره موبایل را وارد کنید"),
});

const recoverySchema = z.object({
  identifier: z.string().min(1, "ایمیل یا موبایل الزامی است"),
  recoveryCode: z.string().min(8, "کد بازیابی باید ۸ کاراکتر باشد"),
});

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState("identifier");
  const [loading, setLoading] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState(null); // null = هنوز چک نشده
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [tempIdentifier, setTempIdentifier] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step === "identifier" ? identifierSchema : recoverySchema),
  });

  // ❌ حذف useEffect که از اول چک میکرد
  // قراره فقط وقتی کاربر فرم رو زد، دستگاه چک بشه

  const verifyOTP = async (userId, code, purpose) => {
    const deviceInfo = JSON.parse(sessionStorage.getItem('deviceInfo') || '{}');
    
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code, deviceInfo, purpose })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      toast.success('ورود موفقیت‌آمیز بود ✅');
      router.push('/dashboard');
      return true;
    } else if (data.requiresDeviceVerification) {
      setShowDeviceModal(true);
      return false;
    } else {
      toast.error(data.error || 'خطا در تایید');
      return false;
    }
  };

  // تابع برای گرفتن اطلاعات دستگاه (فقط موقع لاگین)
  const setupDevice = async () => {
    const deviceData = await collectDeviceInfo();
    const fingerprint = getDeviceFingerprint(deviceData);
    
    sessionStorage.setItem('deviceFingerprint', fingerprint);
    sessionStorage.setItem('deviceInfo', JSON.stringify({
      ...deviceData,
      fingerprint
    }));
    
    return fingerprint;
  };

  async function onSendOtp(data) {
    setLoading(true);
    
    try {
      // ✅ اینجا اطلاعات دستگاه رو جمع کن (نه از اول)
      const fingerprint = await setupDevice();
      const identifier = data.identifier;
      setTempIdentifier(identifier);
      
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: identifier.includes('@') ? identifier : undefined,
          phone: !identifier.includes('@') ? identifier : undefined,
          deviceFingerprint: fingerprint,
          purpose: 'login'
        })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setTempUserId(result.userId);
        
        // ✅ اینجا وضعیت دستگاه رو بر اساس پاسخ سرور تعیین کن
        if (result.isNewDevice) {
          setDeviceStatus('new');
          setShowDeviceModal(true);
          toast.custom((t) => (
            <div className="bg-yellow-500 text-white px-4 py-2 rounded-xl shadow-lg">
              ⚠️ دستگاه جدید شناسایی شد. لطفاً دستگاه خود را تایید کنید.
            </div>
          ));
        } else {
          setDeviceStatus('trusted');
          const otpCode = prompt('کد تایید ۶ رقمی را وارد کنید:');
          if (otpCode) {
            await verifyOTP(result.userId, otpCode, 'login');
          }
        }
      } else {
        toast.error(result.error || 'خطا در ارسال کد');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  }

  async function onRecoveryLogin(data) {
    setLoading(true);
    
    try {
      const fingerprint = sessionStorage.getItem('deviceFingerprint');
      
      if (!fingerprint) {
        toast.error('لطفاً ابتدا اطلاعات دستگاه ثبت شود');
        setLoading(false);
        return;
      }
      
      const res = await fetch('/api/auth/recovery-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: data.identifier,
          code: data.recoveryCode,
          deviceFingerprint: fingerprint
        })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast.success('ورود با کد بازیابی موفق بود ✅');
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'کد بازیابی نامعتبر است');
      }
    } catch (err) {
      toast.error(err.message || 'خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  }

  const handleVerifyNewDevice = async () => {
    setLoading(true);
    
    const deviceFingerprint = sessionStorage.getItem('deviceFingerprint');
    
    try {
      const sendRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: tempUserId,
          email: tempIdentifier.includes('@') ? tempIdentifier : undefined,
          phone: !tempIdentifier.includes('@') ? tempIdentifier : undefined,
          deviceFingerprint,
          purpose: 'device_verification'
        })
      });
      
      const sendData = await sendRes.json();
      
      if (sendRes.ok) {
        const otpCode = prompt('کد تایید برای ثبت دستگاه جدید را وارد کنید:');
        if (otpCode) {
          const success = await verifyOTP(tempUserId, otpCode, 'device_verification');
          if (success) {
            setShowDeviceModal(false);
            setDeviceStatus('trusted');
          }
        }
      } else {
        toast.error(sendData.error || 'خطا در ارسال کد تایید');
      }
    } catch (err) {
      toast.error(err.message || 'خطا در تایید دستگاه');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (data) => {
    if (step === "identifier") {
      onSendOtp(data);
    } else {
      onRecoveryLogin(data);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#f8fafc] overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px]" />

      <div className="w-full max-w-120 px-6 relative z-10">
        
        {/* ✅ نمایش وضعیت دستگاه - فقط بعد از تلاش برای لاگین */}
        {deviceStatus === 'new' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-yellow-800 text-sm font-semibold">دستگاه جدید شناسایی شد</p>
              <p className="text-yellow-600 text-xs">برای ورود باید دستگاه خود را تایید کنید</p>
            </div>
          </motion.div>
        )}
        
        {deviceStatus === 'trusted' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-green-800 text-sm font-semibold">دستگاه قابل اعتماد</p>
              <p className="text-green-600 text-xs">ورود با کد یکبار مصرف</p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl p-10 rounded-4xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100"
        >
          <div className="text-center mb-10">
            <div className="inline-flex p-3 bg-blue-50 rounded-2xl mb-4">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-3">
              {step === "recovery" ? "بازیابی حساب" : "خوش آمدید"}
            </h1>
            <p className="text-gray-500 text-sm">
              {step === "recovery"
                ? "برای بازیابی حساب، کد بازیابی خود را وارد کنید"
                : "لطفاً ایمیل یا شماره موبایل خود را وارد کنید"}
            </p>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 text-right" dir="rtl">
            <AnimatePresence mode="wait">
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
                        ? "border-red-200 focus:border-red-500"
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
                          ? "border-red-200 focus:border-red-500"
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
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
              }`}
            >
              {isSubmitting || loading
                ? "در حال پردازش..."
                : step === "identifier"
                ? "ارسال کد تایید"
                : "بازیابی و ورود"}
            </button>

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
      </div>

      {/* مودال تایید دستگاه */}
      <AnimatePresence>
        {showDeviceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="inline-flex p-3 bg-yellow-100 rounded-2xl mb-4">
                  <AlertTriangle className="w-10 h-10 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">🔐 تایید دستگاه جدید</h3>
                <p className="text-gray-600">
                  دستگاهی که از آن وارد شده‌اید قبلاً ثبت نشده است.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  برای امنیت حساب شما، یک کد تایید به ایمیلتان ارسال خواهد شد.
                </p>
              </div>
              
              <button
                onClick={handleVerifyNewDevice}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-2xl text-white font-bold transition-all disabled:opacity-50"
              >
                {loading ? 'در حال ارسال...' : 'تایید دستگاه'}
              </button>
              
              <button
                onClick={() => setShowDeviceModal(false)}
                className="w-full mt-3 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                انصراف
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}