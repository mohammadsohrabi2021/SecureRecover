// app/register/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Shield } from 'lucide-react';
import { collectDeviceInfo, getDeviceFingerprint } from '@/lib/device-fingerprint';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [deviceInfo, setDeviceInfo] = useState(null);
  
  // جمع‌آوری اطلاعات دستگاه در هنگام لود صفحه
  useEffect(() => {
    collectDeviceData();
  }, []);
  
  const collectDeviceData = async () => {
    try {
      const deviceData = await collectDeviceInfo();
      const fingerprint = getDeviceFingerprint(deviceData);
      
      const fullDeviceInfo = {
        ...deviceData,
        fingerprint
      };
      
      setDeviceInfo(fullDeviceInfo);
      sessionStorage.setItem('deviceInfo', JSON.stringify(fullDeviceInfo));
      
      console.log('📱 Device info collected:', fullDeviceInfo.deviceName);
    } catch (err) {
      console.error('Error collecting device info:', err);
    }
  };
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // اگر دستگاه جمع‌آوری نشده، دوباره جمع کن
      let finalDeviceInfo = deviceInfo;
      if (!finalDeviceInfo) {
        const deviceData = await collectDeviceInfo();
        const fingerprint = getDeviceFingerprint(deviceData);
        finalDeviceInfo = { ...deviceData, fingerprint };
      }
      
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          deviceInfo: finalDeviceInfo
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('ثبت نام با موفقیت انجام شد ✅');
        // بعد از ثبت نام، به صفحه لاگین برو
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        toast.error(data.error || 'خطا در ثبت نام');
      }
    } catch (err) {
      console.error('Register error:', err);
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20"
        >
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-blue-500/20 rounded-2xl mb-4">
              <Shield className="w-12 h-12 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">ایجاد حساب جدید</h1>
            <p className="text-gray-300 text-sm">
              به جمع کاربران SecureRecover بپیوندید
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="نام و نام خانوادگی"
                className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-all"
                required
              />
            </div>
            
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ایمیل"
                className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-all"
                required
              />
            </div>
            
            <div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="شماره تلفن (مثال: 09034007751)"
                className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-all"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl text-white font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'در حال ثبت نام...' : 'ثبت نام'}
            </button>
          </form>
          
          <p className="mt-6 text-center text-gray-400 text-sm">
            قبلاً ثبت نام کرده‌اید؟{' '}
            <a href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
              وارد شوید
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}