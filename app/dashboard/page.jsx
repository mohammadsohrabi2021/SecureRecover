"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Smartphone,
  Clock,
  LogOut,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Activity,
  Globe,
  Laptop,
  X,
  AlertTriangle,
  Key,
  Monitor,
  Tablet,
  Wifi,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Users
} from "lucide-react";
import toast from "react-hot-toast";
import TrustIndicator from "@/components/dashboard/TrustIndicator";
import SessionsList from "@/components/dashboard/SessionsList";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [showRevokeModal, setShowRevokeModal] = useState(null);
  const [showRevokeAllModal, setShowRevokeAllModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);

  useEffect(() => {
    fetchUser();
    fetchSessions();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) setUser(data.data?.user);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/auth/sessions");
      const data = await res.json();
      if (res.ok) setSessions(data.data?.sessions || []);
    } catch (error) {
      console.error(error);
    } finally {
      setSessionsLoading(false);
      setLoading(false);
    }
  };

  const generateRecoveryCodes = async () => {
    try {
      const res = await fetch("/api/recovery/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setRecoveryCodes(data.data?.recoveryCodes || []);
      setShowRecoveryModal(true);
      toast.success("کدهای بازیابی جدید تولید شد");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      const res = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("جلسه با موفقیت بسته شد");
        setShowRevokeModal(null);
        fetchSessions();
      } else {
        toast.error("خطا در بستن جلسه");
      }
    } catch (error) {
      toast.error("خطا در بستن جلسه");
    }
  };

  const revokeAllSessions = async () => {
    try {
      const res = await fetch("/api/auth/sessions/revoke-all", {
        method: "POST",
      });
      if (res.ok) {
        toast.success("تمام جلسات دیگر بسته شد");
        setShowRevokeAllModal(false);
        fetchSessions();
      } else {
        toast.error("خطا در بستن جلسات");
      }
    } catch (error) {
      toast.error("خطا در بستن جلسات");
    }
  };

  const getDeviceIcon = (deviceType) => {
    if (deviceType === "mobile") return <Smartphone size={16} />;
    if (deviceType === "tablet") return <Tablet size={16} />;
    if (deviceType === "desktop") return <Monitor size={16} />;
    return <Laptop size={16} />;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    });
  };

  const getTrustScore = () => {
    // این مقدار باید از API دریافت شود
    return 60;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  خوش آمدید، {user?.name} 👋
                </h1>
                <p className="text-blue-100 text-sm opacity-90">
                  به داشبورد امن SecureRecover خوش آمدید.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm border border-white/10">
              {user?.email}
            </span>
            <span className="bg-green-500/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm border border-green-500/20 flex items-center gap-1">
              <Shield size={14} />
              امنیت بالا
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<Shield size={20} />}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          label="سطح امنیت"
          value="متوسط"
          delay={0.1}
        />
        <StatCard
          icon={<Activity size={20} />}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="جلسات فعال"
          value={sessions.length}
          delay={0.2}
        />
        <StatCard
          icon={<Clock size={20} />}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          label="آخرین ورود"
          value={user?.lastLoginAt ? formatDate(user.lastLoginAt) : "امروز"}
          delay={0.3}
        />
        <StatCard
          icon={<Users size={20} />}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          label="دستگاه‌های معتبر"
          value={sessions.filter(s => s.isTrusted).length || 0}
          delay={0.4}
        />
      </div>


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TrustIndicator />
        </div>
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Smartphone size={18} className="text-blue-600" />
                  جلسات فعال
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  دستگاه‌هایی که به حساب شما متصل هستند
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                  {sessions.filter(s => s.isTrusted).length} دستگاه معتبر
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={() => setShowRevokeAllModal(true)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    بستن همه
                  </button>
                )}
              </div>
            </div>

            <div className="p-5">
              <SessionsList
                sessions={sessions}
                onRevoke={revokeSession}
                onRevokeAll={revokeAllSessions}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Security Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <SecurityActionCard
          icon={<Key size={20} />}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          title="کدهای بازیابی"
          description="تولید کدهای جدید برای بازیابی حساب"
          buttonText="تولید کدهای جدید"
          buttonColor="blue"
          onClick={generateRecoveryCodes}
        />
        <SecurityActionCard
          icon={<AlertCircle size={20} />}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          title="خروج از تمام دستگاه‌ها"
          description="بستن تمام جلسات فعال دیگر"
          buttonText="خروج از همه دستگاه‌ها"
          buttonColor="red"
          onClick={() => setShowRevokeAllModal(true)}
        />
      </motion.div>

      {/* Revoke Session Modal */}
      <AnimatePresence>
        {showRevokeModal && (
          <ConfirmationModal
            title="بستن جلسه"
            message={`آیا از بستن جلسه "${
              showRevokeModal.deviceName || "دستگاه ناشناس"
            }" مطمئن هستید؟`}
            icon={<LogOut size={32} className="text-red-600" />}
            confirmText="بله، بسته شود"
            cancelText="انصراف"
            onConfirm={() => revokeSession(showRevokeModal.sessionId)}
            onCancel={() => setShowRevokeModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Revoke All Sessions Modal */}
      <AnimatePresence>
        {showRevokeAllModal && (
          <ConfirmationModal
            title="خروج از تمام دستگاه‌ها"
            message="آیا از بستن تمام جلسات فعال دیگر (به جز این دستگاه) مطمئن هستید؟"
            icon={<AlertTriangle size={32} className="text-red-600" />}
            confirmText="بله، همه را ببند"
            cancelText="انصراف"
            onConfirm={revokeAllSessions}
            onCancel={() => setShowRevokeAllModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Recovery Codes Modal */}
      <AnimatePresence>
        {showRecoveryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowRecoveryModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key size={32} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  کدهای بازیابی
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  این کدها فقط یک بار نمایش داده می‌شوند. لطفاً آن‌ها را در جای
                  امن ذخیره کنید.
                </p>
              </div>

              <div className="bg-gray-100 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((code, index) => (
                    <div
                      key={index}
                      className="font-mono text-xs md:text-sm bg-white p-2 rounded text-center border border-gray-200"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryCodes.join("\n"));
                    toast.success("کدها کپی شد");
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  کپی همه
                </button>
                <button
                  onClick={() => setShowRecoveryModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, iconBg, iconColor, label, value, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs md:text-sm">{label}</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`w-8 h-8 md:w-10 md:h-10 ${iconBg} rounded-full flex items-center justify-center`}
        >
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </motion.div>
  );
}

// Security Action Card Component
function SecurityActionCard({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  buttonText,
  buttonColor,
  onClick,
}) {
  const buttonColors = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    red: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center`}
        >
          <div className={iconColor}>{icon}</div>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm md:text-base">
            {title}
          </h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        className={`w-full mt-2 px-4 py-2 ${buttonColors[buttonColor]} rounded-lg text-sm font-medium transition-all cursor-pointer`}
      >
        {buttonText}
      </button>
    </div>
  );
}

// Confirmation Modal Component
function ConfirmationModal({
  title,
  message,
  icon,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors cursor-pointer"
            >
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}