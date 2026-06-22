"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Smartphone, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Activity,
  Zap,
  Award
} from "lucide-react";
import Card from "@/components/ui/Card";

export default function TrustIndicator() {
  const [trustData, setTrustData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchTrustData() {
      try {
        const res = await fetch("/api/trust/stats");
        const data = await res.json();
        
        if (res.ok && data.data) {
          setTrustData(data.data.statistics);
        }
      } catch (error) {
        console.error("Error fetching trust data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTrustData();
  }, []);
  
  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-gray-200 rounded-xl"></div>
            <div className="h-20 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </Card>
    );
  }
  
  if (!trustData) return null;
  
  const getLevelConfig = (level) => {
    const configs = {
      HIGH: { 
        color: "emerald", 
        bgColor: "bg-emerald-50", 
        borderColor: "border-emerald-200", 
        textColor: "text-emerald-700",
        badgeColor: "bg-emerald-100 text-emerald-700",
        icon: Shield,
        label: "امنیت بالا",
        description: "ورود بدون نیاز به کد تأیید"
      },
      MEDIUM: { 
        color: "amber", 
        bgColor: "bg-amber-50", 
        borderColor: "border-amber-200", 
        textColor: "text-amber-700",
        badgeColor: "bg-amber-100 text-amber-700",
        icon: Shield,
        label: "امنیت متوسط",
        description: "نیاز به کد یکبار مصرف"
      },
      LOW: { 
        color: "red", 
        bgColor: "bg-red-50", 
        borderColor: "border-red-200", 
        textColor: "text-red-700",
        badgeColor: "bg-red-100 text-red-700",
        icon: AlertTriangle,
        label: "امنیت پایین",
        description: "نیاز به OTP + کد بازیابی"
      },
      CRITICAL: { 
        color: "red", 
        bgColor: "bg-red-50", 
        borderColor: "border-red-200", 
        textColor: "text-red-700",
        badgeColor: "bg-red-100 text-red-700",
        icon: AlertTriangle,
        label: "امنیت بحرانی",
        description: "نیاز به تأیید ادمین"
      }
    };
    return configs[level] || configs.MEDIUM;
  };
  
  const config = getLevelConfig(trustData.level);
  const IconComponent = config.icon;
  
  const getScoreColor = (score) => {
    if (score >= 70) return "text-emerald-600";
    if (score >= 40) return "text-amber-600";
    if (score >= 20) return "text-orange-600";
    return "text-red-600";
  };
  
  const getScoreStatus = (score) => {
    if (score >= 70) return { icon: TrendingUp, text: "عالی", color: "text-emerald-600" };
    if (score >= 40) return { icon: Activity, text: "متوسط", color: "text-amber-600" };
    if (score >= 20) return { icon: TrendingDown, text: "ضعیف", color: "text-orange-600" };
    return { icon: AlertTriangle, text: "بحرانی", color: "text-red-600" };
  };
  
  const status = getScoreStatus(trustData.currentScore);
  const StatusIcon = status.icon;
  
  const getProgressColor = (score) => {
    if (score >= 70) return "bg-gradient-to-r from-emerald-400 to-emerald-600";
    if (score >= 40) return "bg-gradient-to-r from-amber-400 to-amber-600";
    if (score >= 20) return "bg-gradient-to-r from-orange-400 to-orange-600";
    return "bg-gradient-to-r from-red-400 to-red-600";
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${config.bgColor} border ${config.borderColor} rounded-2xl p-6 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl`}
    >
      {/* Header with Icon and Level */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 ${config.bgColor} rounded-2xl flex items-center justify-center border ${config.borderColor} shadow-sm`}>
            <IconComponent className={`w-7 h-7 ${config.textColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-bold text-lg ${config.textColor}`}>
                {config.label}
              </h3>
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeColor}`}>
                {trustData.currentScore}%
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusIcon className={`w-4 h-4 ${status.color}`} />
          <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>امتیاز اعتماد</span>
          <span className="font-medium">{trustData.currentScore} از 100</span>
        </div>
        <div className="w-full bg-gray-200/70 rounded-full h-3 overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, trustData.currentScore))}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-3 rounded-full ${getProgressColor(trustData.currentScore)} shadow-sm`}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>۰</span>
          <span>۵۰</span>
          <span>۱۰۰</span>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium">دستگاه‌های معتبر</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-gray-800">
              {trustData.trustedDevicesCount}
            </span>
            <span className="text-[10px] text-gray-400">دستگاه</span>
          </div>
          {trustData.trustedDevicesCount === 0 && (
            <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              هیچ دستگاهی ثبت نشده
            </p>
          )}
        </div>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium">الگوهای غیرعادی</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-gray-800">
              {trustData.unusualPatternsCount}
            </span>
            <span className="text-[10px] text-gray-400">مورد</span>
          </div>
          {trustData.unusualPatternsCount > 0 && (
            <p className="text-[10px] text-orange-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              فعالیت غیرعادی شناسایی شد
            </p>
          )}
        </div>
      </div>
      
      {/* Recommendation */}
      <div className={`p-3 rounded-xl ${config.bgColor} border ${config.borderColor} mb-4`}>
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5">
            <Zap className={`w-4 h-4 ${config.textColor}`} />
          </div>
          <div>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              {trustData.recommendation}
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-200/50">
        {trustData.lastLoginLocation && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>{trustData.lastLoginLocation}</span>
          </div>
        )}
        {trustData.lastLoginAt && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {new Date(trustData.lastLoginAt).toLocaleDateString("fa-IR", {
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>
        )}
      </div>
      
      {/* Score History Indicator */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
          {[...Array(10)].map((_, i) => {
            const isActive = i < Math.floor(trustData.currentScore / 10);
            return (
              <div
                key={i}
                className={`flex-1 h-full ${isActive ? getProgressColor(trustData.currentScore) : "bg-gray-200"}`}
                style={{ margin: "0 1px" }}
              />
            );
          })}
        </div>
        <span className="text-[10px] text-gray-400">تاریخچه</span>
      </div>
      
      {/* Trust Badge */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        <Award className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[10px] text-gray-400">امتیاز اعتماد پویا</span>
      </div>
    </motion.div>
  );
}