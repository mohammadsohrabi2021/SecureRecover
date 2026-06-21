"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, 
  Laptop, 
  Monitor, 
  Tablet, 
  LogOut, 
  Globe,
  Clock,
  CheckCircle,
  RefreshCw,
  Circle,
  Wifi,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

export default function SecurityPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [showRevokeModal, setShowRevokeModal] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/auth/sessions");
      const data = await res.json();
      if (res.ok) {
        const sessionsWithCurrent = (data.data?.sessions || []).map(session => ({
          ...session,
          isCurrent: checkIfCurrentSession(session)
        }));
        setSessions(sessionsWithCurrent);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfCurrentSession = (session) => {
    // این تابع را بر اساس منطق خودتان تنظیم کنید
    // مثلاً مقایسه sessionId با سشن فعلی
    return false;
  };

  const revokeSession = async (session) => {
    setRevokingId(session.sessionId);
    try {
      const res = await fetch(`/api/auth/sessions/${session.sessionId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("جلسه با موفقیت بسته شد");
        setShowRevokeModal(null);
        fetchSessions();
      } else {
        toast.error("خطا در بستن جلسه");
      }
    } catch (error) {
      toast.error("خطا در بستن جلسه");
    } finally {
      setRevokingId(null);
    }
  };

  const getDeviceIcon = (deviceType, userAgent) => {
    const ua = userAgent?.toLowerCase() || "";
    if (deviceType === "mobile" || ua.includes("mobile")) {
      return <Smartphone size={22} className="text-gray-600" />;
    }
    if (deviceType === "tablet" || ua.includes("tablet")) {
      return <Tablet size={22} className="text-gray-600" />;
    }
    if (deviceType === "desktop" || ua.includes("desktop")) {
      return <Monitor size={22} className="text-gray-600" />;
    }
    return <Laptop size={22} className="text-gray-600" />;
  };

  const getBrowserName = (userAgent) => {
    const ua = userAgent?.toLowerCase() || "";
    if (ua.includes("chrome") && !ua.includes("edg")) return "Chrome";
    if (ua.includes("firefox")) return "Firefox";
    if (ua.includes("edg")) return "Edge";
    if (ua.includes("safari")) return "Safari";
    if (ua.includes("opera")) return "Opera";
    return "مرورگر ناشناس";
  };

  const getBrowserColor = (userAgent) => {
    const ua = userAgent?.toLowerCase() || "";
    if (ua.includes("chrome") && !ua.includes("edg")) return "text-green-600";
    if (ua.includes("firefox")) return "text-orange-500";
    if (ua.includes("edg")) return "text-blue-600";
    if (ua.includes("safari")) return "text-blue-400";
    return "text-gray-400";
  };

  const getOSName = (userAgent) => {
    const ua = userAgent?.toLowerCase() || "";
    if (ua.includes("windows")) return "Windows";
    if (ua.includes("mac")) return "macOS";
    if (ua.includes("linux")) return "Linux";
    if (ua.includes("android")) return "Android";
    if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) return "iOS";
    return "سیستم عامل ناشناس";
  };

  const formatRelativeTime = (date) => {
    if (!date) return "نامشخص";
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60));
    
    if (diff < 1) return "همین حالا";
    if (diff < 60) return `${diff} دقیقه پیش`;
    if (diff < 1440) return `${Math.floor(diff / 60)} ساعت پیش`;
    return d.toLocaleDateString("fa-IR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (date) => {
    if (!date) return "نامشخص";
    return new Date(date).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Smartphone size={18} className="text-blue-600" />
            </div>
            جلسات فعال
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            مدیریت دستگاه‌های متصل به حساب کاربری شما
          </p>
        </div>
        <button
          onClick={fetchSessions}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100 cursor-pointer flex items-center gap-1 text-sm"
        >
          <RefreshCw size={16} />
          بروزرسانی
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          icon={<Smartphone size={18} />}
          label="تعداد دستگاه‌ها"
          value={sessions.length}
          color="blue"
        />
        <StatsCard
          icon={<CheckCircle size={18} />}
          label="دستگاه‌های معتبر"
          value={sessions.filter(s => s.isTrusted).length}
          color="green"
        />
        <StatsCard
          icon={<Wifi size={18} />}
          label="جلسه فعلی"
          value={sessions.filter(s => s.isCurrent).length || 1}
          color="purple"
        />
        <StatsCard
          icon={<Clock size={18} />}
          label="آخرین فعالیت"
          value={sessions[0] ? formatRelativeTime(sessions[0].lastActive) : "-"}
          color="orange"
        />
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">دستگاه‌های متصل</h3>
          <p className="text-xs text-gray-500 mt-1">
            لیست دستگاه‌هایی که به حساب شما دسترسی دارند
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm">در حال بارگذاری جلسات...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">هیچ جلسه فعالی یافت نشد</p>
              <p className="text-gray-400 text-sm mt-1">جلسات فعال در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            sessions.map((session, index) => (
              <SessionItem
                key={session._id}
                session={session}
                index={index}
                revokingId={revokingId}
                onRevoke={() => setShowRevokeModal(session)}
                getDeviceIcon={getDeviceIcon}
                getBrowserName={getBrowserName}
                getBrowserColor={getBrowserColor}
                getOSName={getOSName}
                formatDate={formatDate}
                formatRelativeTime={formatRelativeTime}
              />
            ))
          )}
        </div>
      </div>

      {/* Revoke Confirmation Modal */}
      <AnimatePresence>
        {showRevokeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">بستن جلسه</h3>
                <p className="text-gray-500 text-sm mb-6">
                  آیا از بستن جلسه "{showRevokeModal.deviceName || "دستگاه ناشناس"}" مطمئن هستید؟
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => revokeSession(showRevokeModal)}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    بله، بسته شود
                  </button>
                  <button
                    onClick={() => setShowRevokeModal(null)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Stats Card Component
function StatsCard({ icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-10 h-10 ${colors[color]} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// Session Item Component
function SessionItem({ 
  session, 
  index, 
  revokingId, 
  onRevoke, 
  getDeviceIcon, 
  getBrowserName, 
  getBrowserColor,
  getOSName,
  formatDate,
  formatRelativeTime
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-5 hover:bg-gray-50 transition-all duration-300 ${
        session.isCurrent ? "bg-gradient-to-r from-blue-50/50 to-white" : ""
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Device Info */}
        <div className="flex items-start gap-4 flex-1">
          {/* Device Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            session.isCurrent 
              ? "bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md" 
              : "bg-gray-100"
          }`}>
            {getDeviceIcon(session.deviceType, session.userAgent)}
          </div>

          {/* Device Details */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h4 className="font-semibold text-gray-900">
                {session.deviceName || "دستگاه ناشناس"}
              </h4>
              {session.isCurrent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  <CheckCircle size={10} />
                  جلسه فعلی
                </span>
              )}
              {session.isTrusted && !session.isCurrent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  <CheckCircle size={10} />
                  دستگاه معتبر
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              <span className={`flex items-center gap-1.5 ${getBrowserColor(session.userAgent)}`}>
                <Circle size={8} fill="currentColor" className="opacity-70" />
                {getBrowserName(session.userAgent)}
              </span>
              <span className="flex items-center gap-1.5 text-gray-500">
                <Monitor size={12} />
                {getOSName(session.userAgent)}
              </span>
              <span className="flex items-center gap-1.5 text-gray-500">
                <Globe size={12} />
                {session.ip || "IP نامشخص"}
              </span>
              <span className="flex items-center gap-1.5 text-gray-500" title={formatDate(session.lastActive)}>
                <Clock size={12} />
                {formatRelativeTime(session.lastActive)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!session.isCurrent && (
          <button
            onClick={onRevoke}
            disabled={revokingId === session.sessionId}
            className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer disabled:opacity-50 text-sm font-medium"
          >
            {revokingId === session.sessionId ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogOut size={16} />
                بستن جلسه
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}