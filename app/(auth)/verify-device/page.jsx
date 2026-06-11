// app/verify-device/page.jsx - ارسال loginMethod
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Shield, Smartphone, Mail, ArrowRight, CheckCircle } from 'lucide-react';

export default function VerifyDevicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const identifier = searchParams.get('identifier');
  
  const [step, setStep] = useState('send');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendMethod, setSendMethod] = useState(null);
  const [targetContact, setTargetContact] = useState('');
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  
  const hasSentRef = useRef(false);
  
  // ✅ تشخیص روش ورود کاربر
  const loginMethod = identifier?.includes('@') ? 'email' : 'phone';
  
  useEffect(() => {
    if (step === 'send' && !hasSentRef.current) {
      hasSentRef.current = true;
      handleSendVerification();
    }
  }, []);
  
  useEffect(() => {
    if (timer > 0 && step === 'verify') {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, step]);
  
  const handleSendVerification = async () => {
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          method: loginMethod,
          contact: identifier
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSendMethod(data.sendMethod);
        setTargetContact(data.targetContact);
        setStep('verify');
        toast.success(data.message);
      } else {
        toast.error(data.error || 'خطا در ارسال کد تایید');
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch (error) {
      console.error('Send verification error:', error);
      toast.error('خطا در ارسال کد تایید');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      toast.error('کد باید ۶ رقم باشد');
      return;
    }
    
    setLoading(true);
    
    const deviceInfo = JSON.parse(sessionStorage.getItem('deviceInfo') || '{}');
    const deviceFingerprint = sessionStorage.getItem('deviceFingerprint');
    
    // ✅ ارسال loginMethod به API
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        code: otpCode,
        deviceInfo: { 
          ...deviceInfo, 
          fingerprint: deviceFingerprint,
          loginMethod  // ✅ ارسال loginMethod
        },
        purpose: 'device_verification',
        loginMethod  // ✅ ارسال مستقیم
      })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      toast.success('✅ دستگاه با موفقیت تایید شد');
      router.push('/dashboard');
    } else {
      toast.error(data.error || 'خطا در تایید دستگاه');
    }
    
    setLoading(false);
  };
  
  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    setCanResend(false);
    setTimer(120);
    
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, method: loginMethod, contact: identifier })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success('کد جدید ارسال شد');
      } else {
        toast.error(data.error || 'خطا در ارسال مجدد');
        setCanResend(true);
      }
    } catch (error) {
      toast.error('خطا در ارسال مجدد');
      setCanResend(true);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 to-orange-600/20" />
      
      <div className="w-full max-w-md px-6 relative z-10">
        <AnimatePresence mode="wait">
          {step === 'send' ? (
            <motion.div
              key="send"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center"
            >
              <div className="inline-flex p-3 bg-yellow-500/20 rounded-2xl mb-4">
                <Shield className="w-12 h-12 text-yellow-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">در حال ارسال کد تایید...</h2>
              <p className="text-gray-300 text-sm">لطفاً چند لحظه صبر کنید</p>
              <div className="mt-6 flex justify-center">
                <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20"
            >
              <div className="text-center mb-6">
                <div className="inline-flex p-3 bg-blue-500/20 rounded-2xl mb-4">
                  {sendMethod === 'email' ? (
                    <Mail className="w-12 h-12 text-blue-400" />
                  ) : (
                    <Smartphone className="w-12 h-12 text-green-400" />
                  )}
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">تایید دستگاه جدید</h1>
                <p className="text-gray-300 text-sm">
                  برای امنیت حساب شما، کد تایید به
                </p>
                <p className="text-blue-400 font-medium text-sm mt-1">
                  {sendMethod === 'email' ? 'ایمیل' : 'شماره تماس'} {targetContact}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  ارسال شد
                </p>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-300 text-center mb-3">
                    کد تایید ۶ رقمی را وارد کنید
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl tracking-widest font-mono focus:border-blue-500 focus:outline-none transition-all"
                    maxLength={6}
                    autoFocus
                  />
                </div>
                
                <button
                  onClick={handleVerify}
                  disabled={loading || otpCode.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      تایید دستگاه
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
                
                <div className="text-center">
                  {canResend ? (
                    <button
                      onClick={handleResend}
                      disabled={loading}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      ارسال مجدد کد
                    </button>
                  ) : (
                    <p className="text-sm text-gray-400">
                      ارسال مجدد کد در {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                    </p>
                  )}
                </div>
                
                <div className="border-t border-white/10 pt-4">
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full py-2 text-gray-400 hover:text-gray-300 text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowRight className="w-3 h-3" />
                    بازگشت به صفحه ورود
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}