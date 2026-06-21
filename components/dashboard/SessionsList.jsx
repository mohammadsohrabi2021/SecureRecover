"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, 
  Laptop, 
  Monitor, 
  Tablet, 
  LogOut, 
  Trash2,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Wifi,
  Signal,
  Terminal,
  Circle
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function SessionsList({ sessions, onRevoke, onRevokeAll }) {
  const [revokingId, setRevokingId] = useState(null);
  const [showRevokeModal, setShowRevokeModal] = useState(null);

  const getDeviceIcon = (deviceType, userAgent) => {
    const ua = userAgent?.toLowerCase() || "";
    
    if (deviceType === "mobile" || ua.includes("mobile")) {
      return <Smartphone size={20} className="text-gray-600" />;
    }
    if (deviceType === "tablet" || ua.includes("tablet")) {
      return <Tablet size={20} className="text-gray-600" />;
    }
    if (deviceType === "desktop" || ua.includes("desktop")) {
      return <Monitor size={20} className="text-gray-600" />;
    }
    return <Laptop size={20} className="text-gray-600" />;
  };

  const getBrowserColor = (userAgent) => {
    const ua = userAgent?.toLowerCase() || "";
    if (ua.includes("chrome") && !ua.includes("edg")) return "text-green-600";
    if (ua.includes("firefox")) return "text-orange-500";
    if (ua.includes("edg")) return "text-blue-600";
    if (ua.includes("safari")) return "text-blue-400";
    return "text-gray-400";
  };

  const getBrowserInitial = (userAgent) => {
    const ua = userAgent?.toLowerCase() || "";
    if (ua.includes("chrome") && !ua.includes("edg")) return "C";
    if (ua.includes("firefox")) return "F";
    if (ua.includes("edg")) return "E";
    if (ua.includes("safari")) return "S";
    if (ua.includes("opera")) return "O";
    return "?";
  };

  const getOSName = (userAgent) => {
    const ua = userAgent?.toLowerCase() || "";
    if (ua.includes("windows")) return "Windows";
    if (ua.includes("mac")) return "macOS";
    if (ua.includes("linux")) return "Linux";
    if (ua.includes("android")) return "Android";
    if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) return "iOS";
    return "Unknown";
  };

  const getBrowserName = (userAgent) => {
    const ua = userAgent?.toLowerCase() || "";
    if (ua.includes("chrome") && !ua.includes("edg")) return "Chrome";
    if (ua.includes("firefox")) return "Firefox";
    if (ua.includes("edg")) return "Edge";
    if (ua.includes("safari")) return "Safari";
    if (ua.includes("opera")) return "Opera";
    return "Unknown";
  };

  const formatDate = (date) => {
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

  const getDeviceQuality = (userAgent) => {
    const ua = userAgent?.toLowerCase() || "";
    if (ua.includes("windows") || ua.includes("mac")) return "high";
    if (ua.includes("iphone") || ua.includes("ipad")) return "high";
    return "medium";
  };

  const handleRevoke = async (session) => {
    setRevokingId(session.sessionId);
    try {
      await onRevoke(session.sessionId);
      toast.success("جلسه با موفقیت بسته شد");
    } catch (error) {
      toast.error("خطا در بستن جلسه");
    } finally {
      setRevokingId(null);
      setShowRevokeModal(null);
    }
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smartphone size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          هیچ جلسه فعالی یافت نشد
        </h3>
        <p className="text-gray-500 text-sm">
          جلسات فعال در اینجا نمایش داده می‌شوند
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, index) => {
        const isCurrent = session.isCurrent;
        const quality = getDeviceQuality(session.userAgent);
        const browserColor = getBrowserColor(session.userAgent);
        const browserInitial = getBrowserInitial(session.userAgent);
        
        return (
          <motion.div
            key={session._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group relative bg-white rounded-xl border transition-all duration-300 hover:shadow-md ${
              isCurrent 
                ? "border-blue-200 bg-gradient-to-r from-blue-50/50 to-white" 
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            {isCurrent && (
              <div className="absolute -top-2 -right-2">
                <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                  <CheckCircle size={10} />
                  جلسه فعلی
                </div>
              </div>
            )}

            <div className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      isCurrent 
                        ? "bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md" 
                        : "bg-gradient-to-br from-gray-100 to-gray-200"
                    }`}>
                      {getDeviceIcon(session.deviceType, session.userAgent)}
                    </div>
                    {isCurrent && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {session.deviceName || "دستگاه ناشناس"}
                      </h4>
                      {session.isTrusted && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          <CheckCircle size={10} />
                          معتبر
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className={`flex items-center gap-1 ${browserColor}`}>
                        <Circle size={8} fill="currentColor" />
                        {getBrowserName(session.userAgent)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Monitor size={12} />
                        {getOSName(session.userAgent)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe size={12} />
                        {session.ip || "نامشخص"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(session.lastActive)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <Signal size={10} className="text-green-500" />
                        <span className="text-xs text-gray-400">
                          {quality === "high" ? "کیفیت خوب" : "کیفیت متوسط"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => setShowRevokeModal(session)}
                    disabled={revokingId === session.sessionId}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {revokingId === session.sessionId ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogOut size={16} />
                        <span className="text-sm font-medium">بستن جلسه</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {showRevokeModal === session && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl max-w-md w-full p-6"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogOut size={32} className="text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        بستن جلسه
                      </h3>
                      <p className="text-gray-500 text-sm mb-6">
                        آیا از بستن جلسه "{session.deviceName || "دستگاه ناشناس"}" مطمئن هستید؟
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleRevoke(session)}
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
          </motion.div>
        );
      })}
    </div>
  );
}