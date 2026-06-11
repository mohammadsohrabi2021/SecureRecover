// app/dashboard/page.jsx - نسخه کاملاً حرفه‌ای
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Shield,
  Key,
  Activity,
  Mail,
  Phone,
  Clock,
  ChevronRight,
  CheckCircle,
  Smartphone,
  Globe,
  LogOut,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Monitor,
  AlertTriangle,
  Award,
  Fingerprint,
  Trash2,
  Power,
  AlertCircle,
  Zap,
  Crown,
  History,
  MapPin,
  Cpu,
  Laptop,
  Compass
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [devices, setDevices] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showCodes, setShowCodes] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [securityScore, setSecurityScore] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showRevokeAllModal, setShowRevokeAllModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeSessions: 0,
    securityLevel: 'high'
  });

  useEffect(() => {
    fetchUserData();
    fetchRecoveryCodes();
    fetchSessions();
    fetchDevices();
    fetchActivities();
  }, []);

  useEffect(() => {
    calculateSecurityScore();
  }, [devices, recoveryCodes, sessions]);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecoveryCodes = async () => {
    try {
      const res = await fetch('/api/auth/recovery-codes');
      if (res.ok) {
        const data = await res.json();
        setRecoveryCodes(data.codes || []);
      }
    } catch (error) {
      console.error('Error fetching codes:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      console.log('🔄 Fetching sessions...');
      const res = await fetch('/api/auth/sessions');
      
      if (res.ok) {
        const data = await res.json();
        console.log('📦 Sessions received:', data.sessions?.length || 0);
        setSessions(data.sessions || []);
        setStats(prev => ({ ...prev, activeSessions: data.sessions?.length || 0 }));
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        console.error('Sessions API error:', res.status);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchDevices = async () => {
    try {
      console.log('🔄 Fetching devices...');
      const res = await fetch('/api/auth/devices');
      console.log('📡 Response status:', res.status);
      
      const data = await res.json();
      console.log('📦 Response data:', data);
      
      if (res.ok) {
        setDevices(data.devices || []);
        setStats(prev => ({ ...prev, totalDevices: data.devices?.length || 0 }));
      } else {
        console.error('API error:', data.error);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/auth/security-logs');
      if (res.ok) {
        const data = await res.json();
        setActivities(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const calculateSecurityScore = () => {
    let score = 20; // base
    if (devices.length > 0) score += 20;
    if (recoveryCodes.length > 0) score += 30;
    if (sessions.length === 1) score += 15;
    if (user?.lastLoginAt && new Date(user.lastLoginAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) score += 15;
    setSecurityScore(Math.min(score, 100));
  };

  const handleGenerateNewCodes = async () => {
    if (generating) return;
    setGenerating(true);
    const loadingToast = toast.loading('در حال تولید کدهای جدید...');
    
    try {
      const res = await fetch('/api/auth/generate-recovery-codes', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      
      if (res.ok && data.codes) {
        setRecoveryCodes(data.codes);
        setShowCodes(true);
        toast.success(`${data.codes.length} کد جدید ساخته شد`, { id: loadingToast });
      } else {
        throw new Error(data.error || 'خطا در تولید کدها');
      }
    } catch (error) {
      console.error('Error generating codes:', error);
      toast.error(error.message || 'خطا در تولید کدها', { id: loadingToast });
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      const res = await fetch(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('نشست با موفقیت باطل شد');
        fetchSessions();
        setShowRevokeModal(false);
        setSelectedSession(null);
      } else {
        toast.error('خطا در باطل کردن نشست');
      }
    } catch (error) {
      toast.error('خطا در باطل کردن نشست');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      const res = await fetch('/api/auth/sessions/revoke-all', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'همه نشست‌ها باطل شدند');
        // ✅ فقط نشست جاری را نگه دار
        const currentSession = sessions.find(s => s.isCurrent);
        setSessions(currentSession ? [currentSession] : []);
        setShowRevokeAllModal(false);
      } else {
        toast.error(data.error || 'خطا در باطل کردن نشست‌ها');
      }
    } catch (error) {
      console.error('Revoke all error:', error);
      toast.error('خطا در باطل کردن نشست‌ها');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const copyToClipboard = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('کد کپی شد');
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Smartphone className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getBrowserIcon = (browser) => {
    switch (browser?.toLowerCase()) {
      case 'chrome': return <Zap className="w-3 h-3" />;
      case 'firefox': return <Crown className="w-3 h-3" />;
      case 'safari': return <Compass className="w-3 h-3" />;
      default: return <Monitor className="w-3 h-3" />;  // ✅ اصلاح: BrowserIcon وجود ندارد
    }
  };

  const getActivityIcon = (action) => {
    if (action.includes('LOGIN')) return <LogOut className="w-4 h-4 text-green-400" />;
    if (action.includes('DEVICE')) return <Smartphone className="w-4 h-4 text-blue-400" />;
    if (action.includes('RECOVERY')) return <Key className="w-4 h-4 text-yellow-400" />;
    if (action.includes('LOGOUT')) return <Power className="w-4 h-4 text-red-400" />;
    return <Activity className="w-4 h-4 text-purple-400" />;
  };

  const formatDate = (date) => {
    if (!date) return 'نامشخص';
    return new Date(date).toLocaleDateString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatRelativeTime = (date) => {
    if (!date) return 'نامشخص';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'لحظاتی پیش';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    return `${diffDays} روز پیش`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* هدر */}
      <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  SecureRecover
                </h1>
                <p className="text-xs text-gray-500">مرکز امنیت حساب کاربری</p>
              </div>
            </div>
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* سایدبار - اطلاعات کاربر */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6"
            >
              <div className="text-center mb-6">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full animate-pulse opacity-50" />
                  <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800" />
                </div>
                <h2 className="text-xl font-bold text-white">{user?.name || 'کاربر'}</h2>
                <p className="text-gray-400 text-sm">کاربر ویژه</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-xl group hover:bg-gray-700/50 transition-all">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">ایمیل</p>
                    <p className="text-white text-sm truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-xl group hover:bg-gray-700/50 transition-all">
                  <Phone className="w-5 h-5 text-green-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">شماره تماس</p>
                    <p className="text-white text-sm">{user?.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-xl group hover:bg-gray-700/50 transition-all">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">آخرین ورود</p>
                    <p className="text-white text-sm">{formatRelativeTime(user?.lastLoginAt)}</p>
                    <p className="text-gray-500 text-xs mt-1">{formatDate(user?.lastLoginAt)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">امتیاز امنیت</span>
                  <span className={`text-xl font-bold ${
                    securityScore >= 80 ? 'text-green-400' : 
                    securityScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{securityScore}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      securityScore >= 80 ? 'bg-green-500' : 
                      securityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${securityScore}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <Award className="w-4 h-4" />
                  <span>
                    {securityScore >= 80 ? 'امنیت عالی' : 
                     securityScore >= 50 ? 'امنیت متوسط' : 'نیاز به بهبود'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="text-center p-2 bg-gray-700/20 rounded-lg">
                    <p className="text-xs text-gray-500">امتیاز پایه</p>
                    <p className="text-sm font-bold text-white">20%</p>
                  </div>
                  <div className="text-center p-2 bg-gray-700/20 rounded-lg">
                    <p className="text-xs text-gray-500">امتیاز اضافه</p>
                    <p className="text-sm font-bold text-white">{securityScore - 20}%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* محتوای اصلی */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* آمار سریع */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-800/30 rounded-xl p-4 text-center border border-gray-700 hover:border-blue-500/50 transition-all">
                <Fingerprint className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.totalDevices}</p>
                <p className="text-xs text-gray-500">دستگاه متصل</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-800/30 rounded-xl p-4 text-center border border-gray-700 hover:border-green-500/50 transition-all">
                <Globe className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.activeSessions}</p>
                <p className="text-xs text-gray-500">نشست فعال</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-800/30 rounded-xl p-4 text-center border border-gray-700 hover:border-yellow-500/50 transition-all">
                <Key className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{recoveryCodes.length}</p>
                <p className="text-xs text-gray-500">کد بازیابی</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-800/30 rounded-xl p-4 text-center border border-gray-700 hover:border-purple-500/50 transition-all">
                <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{activities.length}</p>
                <p className="text-xs text-gray-500">فعالیت اخیر</p>
              </motion.div>
            </div>

            {/* کدهای بازیابی */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6"
            >
              <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-bold text-white">کدهای بازیابی</h3>
                </div>
                <div className="flex gap-2">
                  {recoveryCodes.length > 0 && (
                    <button
                      onClick={() => setShowCodes(!showCodes)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-sm transition-all"
                    >
                      {showCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showCodes ? 'مخفی کردن' : 'نمایش کدها'}
                    </button>
                  )}
                  <button
                    onClick={handleGenerateNewCodes}
                    disabled={generating}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                    {generating ? 'در حال تولید...' : 'تولید کد جدید'}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showCodes && recoveryCodes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4"
                  >
                    {recoveryCodes.map((code, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-gradient-to-r from-gray-900/50 to-gray-900/30 rounded-lg p-3 font-mono text-sm text-gray-300 border border-gray-700 flex justify-between items-center group hover:border-blue-500/50 transition-all"
                      >
                        <span className="tracking-wider">{code}</span>
                        <button
                          onClick={() => copyToClipboard(code, idx)}
                          className="opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-gray-700 rounded"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {recoveryCodes.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-400 text-sm">هیچ کد بازیابی ای وجود ندارد</p>
                  <p className="text-gray-500 text-xs mt-1">برای افزایش امنیت حساب، کدهای بازیابی را تولید کنید</p>
                  <button
                    onClick={handleGenerateNewCodes}
                    disabled={generating}
                    className="mt-3 text-blue-400 text-sm hover:underline"
                  >
                    {generating ? 'در حال تولید...' : 'تولید کدهای بازیابی'}
                  </button>
                </motion.div>
              )}
              
              <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                این کدها فقط یکبار قابل استفاده هستند. آنها را در جای امنی ذخیره کنید.
              </p>
            </motion.div>

            {/* دستگاه‌های متصل و نشست‌ها */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
  className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6"
>
  <div className="flex justify-between items-center mb-4">
    <div className="flex items-center gap-2">
      <Smartphone className="w-5 h-5 text-green-500" />
      <h3 className="text-lg font-bold text-white">دستگاه‌های متصل</h3>
    </div>
    {devices.length > 1 && (
      <button
        onClick={() => setShowRevokeAllModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-all"
      >
        <Power className="w-4 h-4" />
        خروج از همه دستگاه‌ها
      </button>
    )}
  </div>

  {devices.length === 0 ? (
    <div className="text-center py-6 text-gray-500 text-sm">
      <Monitor className="w-12 h-12 mx-auto mb-3 opacity-30" />
      هیچ دستگاهی ثبت نشده است
    </div>
  ) : (
    <div className="space-y-3">
      {/* ✅ اصلاح: استفاده از devices به جای sessions */}
      {devices.map((device) => (
        <motion.div
          key={device._id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between p-4 bg-gray-700/20 rounded-xl hover:bg-gray-700/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              {getDeviceIcon(device.deviceType)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-medium">{device.deviceName || 'دستگاه ناشناس'}</p>
                {/* بررسی دستگاه جاری - نیاز به منطق جداگانه دارد */}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  {getBrowserIcon(device.browser)}
                  {device.browser || 'نامشخص'}
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {device.os || 'نامشخص'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(device.lastUsedAt)}
                </span>
              </div>
            </div>
          </div>
          {/* دکمه حذف دستگاه - در صورت نیاز */}
        </motion.div>
      ))}
    </div>
  )}
</motion.div>

            {/* گزارش فعالیت‌ها */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-bold text-white">گزارش فعالیت‌ها</h3>
              </div>

              {activities.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  هیچ فعالیتی ثبت نشده است
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {activities.slice(0, 10).map((activity, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex items-center justify-between p-3 bg-gray-700/20 rounded-xl hover:bg-gray-700/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.action)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {activity.action === 'LOGIN_SUCCESS' ? 'ورود موفق' :
                             activity.action === 'DEVICE_TRUSTED' ? 'ثبت دستگاه جدید' :
                             activity.action === 'RECOVERY_CODES_GENERATED' ? 'تولید کدهای بازیابی' :
                             activity.action === 'LOGOUT' ? 'خروج از حساب' :
                             activity.action === 'SESSION_REVOKED' ? 'باطل کردن نشست' :
                             activity.action === 'ALL_SESSIONS_REVOKED' ? 'خروج از همه دستگاه‌ها' :
                             activity.action}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {activity.ip || 'نامشخص'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(activity.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        activity.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {activity.status === 'success' ? 'موفق' : 'ناموفق'}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activities.length > 10 && (
                <button className="w-full mt-4 py-2 text-center text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center justify-center gap-1">
                  مشاهده همه فعالیت‌ها
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>

          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 mt-8 py-6">
        <div className="container mx-auto px-4 text-center text-gray-500 text-xs">
          SecureRecover © 1404 - مرکز امنیت حساب کاربری
        </div>
      </footer>

      {/* ============================================ */}
      {/* مودال تأیید خروج */}
      {/* ============================================ */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl max-w-md w-full p-6 border border-gray-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">خروج از حساب</h3>
                <p className="text-gray-400 text-sm">
                  آیا از خروج از حساب کاربری خود اطمینان دارید؟
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-all"
                >
                  انصراف
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium transition-all"
                >
                  خروج
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* مودال تأیید حذف یک نشست */}
      {/* ============================================ */}
      <AnimatePresence>
        {showRevokeModal && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRevokeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl max-w-md w-full p-6 border border-gray-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">باطل کردن نشست</h3>
                <p className="text-gray-400 text-sm">
                  آیا از باطل کردن نشست زیر اطمینان دارید؟
                </p>
                <div className="mt-3 p-3 bg-gray-700/30 rounded-xl">
                  <p className="text-white text-sm font-medium">{selectedSession.deviceName}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {selectedSession.browser} • {selectedSession.os}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRevokeModal(false)}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-all"
                >
                  انصراف
                </button>
                <button
                  onClick={() => handleRevokeSession(selectedSession.id)}
                  className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-xl text-white font-medium transition-all"
                >
                  باطل کردن
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* مودال تأیید حذف همه نشست‌ها */}
      {/* ============================================ */}
      <AnimatePresence>
        {showRevokeAllModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRevokeAllModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl max-w-md w-full p-6 border border-gray-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Power className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">خروج از همه دستگاه‌ها</h3>
                <p className="text-gray-400 text-sm">
                  با این کار از تمام دستگاه‌های دیگر خارج می‌شوید.
                  دستگاه جاری شما همچنان متصل می‌ماند.
                </p>
                <p className="text-yellow-500 text-xs mt-3">
                  ⚠️ این عمل غیرقابل بازگشت است
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRevokeAllModal(false)}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-all"
                >
                  انصراف
                </button>
                <button
                  onClick={handleRevokeAllSessions}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium transition-all"
                >
                  تأیید و خروج
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.8);
        }
      `}</style>
    </div>
  );
}