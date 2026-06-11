// app/login/page.jsx - نسخه اصلاح شده نهایی
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { collectDeviceInfo, getDeviceFingerprint } from '@/lib/device-fingerprint';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [showDeviceStatus, setShowDeviceStatus] = useState(false);
  
  // ❌ حذف useEffect برای checkDevice - فقط بعد از ارسال چک می‌شود
  
  const checkDevice = async () => {
    try {
      const deviceData = await collectDeviceInfo();
      const fingerprint = getDeviceFingerprint(deviceData);
      
      sessionStorage.setItem('deviceFingerprint', fingerprint);
      sessionStorage.setItem('deviceInfo', JSON.stringify({
        ...deviceData,
        fingerprint
      }));
      
      const res = await fetch('/api/auth/check-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceFingerprint: fingerprint })
      });
      
      const data = await res.json();
      setDeviceStatus(data.isTrusted ? 'trusted' : 'new');
      setShowDeviceStatus(true);
      return data.isTrusted;
    } catch (err) {
      console.error(err);
      setDeviceStatus('new');
      setShowDeviceStatus(true);
      return false;
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const deviceFingerprint = sessionStorage.getItem('deviceFingerprint');
      
      // اگر deviceFingerprint وجود نداشت، اول جمع‌آوری کن
      if (!deviceFingerprint) {
        const deviceData = await collectDeviceInfo();
        const newFingerprint = getDeviceFingerprint(deviceData);
        sessionStorage.setItem('deviceFingerprint', newFingerprint);
        sessionStorage.setItem('deviceInfo', JSON.stringify({
          ...deviceData,
          fingerprint: newFingerprint
        }));
      }
      
      const finalFingerprint = sessionStorage.getItem('deviceFingerprint');
      
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: identifier.includes('@') ? identifier : undefined,
          phone: !identifier.includes('@') ? identifier : undefined,
          deviceFingerprint: finalFingerprint,
          purpose: 'login'
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        sessionStorage.setItem('tempUserId', data.userId);
        
        // ✅ بعد از موفقیت، وضعیت دستگاه رو چک کن
        const isTrusted = await checkDevice();
        
        if (data.isNewDevice === true) {
          router.push(`/verify-device?userId=${data.userId}&identifier=${encodeURIComponent(identifier)}`);
        } else {
          router.push(`/verify-otp?userId=${data.userId}&identifier=${encodeURIComponent(identifier)}&purpose=login`);
        }
      } else {
        // ✅ اگر کاربر وجود نداشت، هدایت به صفحه ثبت‌نام
        if (res.status === 404 || data.error?.includes('یافت نشد')) {
          toast.error('کاربری با این اطلاعات یافت نشد');
          // ✅ هدایت خودکار به صفحه ثبت‌نام بعد از 1.5 ثانیه
          setTimeout(() => {
            router.push('/register');
          }, 1500);
        } else {
          toast.error(data.error || 'خطا در ارسال کد');
        }
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRecoveryLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let deviceFingerprint = sessionStorage.getItem('deviceFingerprint');
      
      if (!deviceFingerprint) {
        const deviceData = await collectDeviceInfo();
        deviceFingerprint = getDeviceFingerprint(deviceData);
        sessionStorage.setItem('deviceFingerprint', deviceFingerprint);
        sessionStorage.setItem('deviceInfo', JSON.stringify({
          ...deviceData,
          fingerprint: deviceFingerprint
        }));
      }
      
      const res = await fetch('/api/auth/recovery-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          code: recoveryCode,
          deviceFingerprint
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('ورود با کد بازیابی موفق بود');
        router.push('/dashboard');
      } else if (data.requiresDeviceVerification) {
        toast.error('این دستگاه قبلاً ثبت نشده است. ابتدا دستگاه خود را تایید کنید.');
        router.push(`/verify-device?identifier=${encodeURIComponent(identifier)}`);
      } else if (res.status === 404 || data.error?.includes('یافت نشد')) {
        toast.error('کاربری با این اطلاعات یافت نشد');
        setTimeout(() => {
          router.push('/register');
        }, 1500);
      } else {
        toast.error(data.error || 'کد بازیابی نامعتبر است');
      }
    } catch (err) {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-md px-6 relative z-10">
        
        {/* ✅ نمایش وضعیت دستگاه - فقط بعد از ارسال و فقط در حالت trusted */}
        {/* حذف نمایش حالت new از این بخش - فقط trusted نمایش داده می‌شود */}
        {showDeviceStatus && deviceStatus === 'trusted' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-green-500 font-semibold">دستگاه قابل اعتماد</p>
              <p className="text-green-500/80 text-xs">ورود با کد یکبار مصرف</p>
            </div>
          </motion.div>
        )}
        
        {/* ❌ بخش deviceStatus === 'new' حذف شد - دیگر نمایش داده نمی‌شود */}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20"
        >
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-blue-500/20 rounded-2xl mb-4">
              <Shield className="w-12 h-12 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {step === 'login' ? 'خوش آمدید' : 'بازیابی حساب'}
            </h1>
            <p className="text-gray-300 text-sm">
              {step === 'login' 
                ? 'لطفاً ایمیل یا شماره موبایل خود را وارد کنید'
                : 'کد بازیابی ۸ کاراکتری خود را وارد کنید'}
            </p>
          </div>
          
          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="ایمیل یا شماره تماس"
                className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-all"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl text-white font-semibold transition-all disabled:opacity-50"
              >
                {loading ? 'در حال ارسال کد...' : 'ارسال کد تایید'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecoveryLogin} className="space-y-5">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="ایمیل یا شماره تماس"
                className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                required
              />
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                placeholder="کد بازیابی (مثال: A1B2C3D4)"
                className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 text-center font-mono focus:border-purple-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl text-white font-semibold transition-all disabled:opacity-50"
              >
                {loading ? 'در حال بررسی...' : 'بازیابی و ورود'}
              </button>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setStep(step === 'login' ? 'recovery' : 'login')}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              {step === 'login' ? 'ورود با کد بازیابی' : 'بازگشت به ورود عادی'}
            </button>
          </div>
          
          <p className="mt-6 text-center text-gray-400 text-sm">
            حساب کاربری ندارید؟{' '}
            <a href="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
              ثبت‌نام رایگان
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}