"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Shield, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

const severityColors = {
  success: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
};

const actionLabels = {
  LOGIN_SUCCESS: "ورود موفق",
  LOGIN_BLOCKED: "ورود مسدود",
  LOGIN_ATTEMPT_FAILED: "تلاش ناموفق ورود",
  OTP_VERIFIED: "تأیید OTP",
  OTP_MAX_ATTEMPTS: "تلاش بیش از حد OTP",
  RECOVERY_USED: "استفاده از کد بازیابی",
  RECOVERY_FAILED: "کد بازیابی نامعتبر",
  SESSION_REVOKED: "بستن جلسه",
  ADMIN_APPROVAL_REQUESTED: "درخواست تأیید ادمین",
  ADMIN_APPROVED_LOGIN: "تأیید ورود توسط ادمین",
  ADMIN_REJECTED_LOGIN: "رد ورود توسط ادمین",
  ADMIN_APPROVED_LOGIN_COMPLETED: "تکمیل ورود با تأیید ادمین",
  TRUST_SCORE_CHANGED: "تغییر امتیاز اعتماد",
  ACCOUNT_LOCKED: "قفل حساب",
  ACCOUNT_UNLOCKED: "باز کردن حساب",
};

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch("/api/security/logs");
      const data = await res.json();
      if (res.ok) setLogs(data.data?.logs || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity size={24} className="text-blue-600" />
            فعالیت امنیتی
          </h1>
          <p className="text-gray-500 text-sm mt-1">تاریخچه رویدادهای امنیتی حساب شما</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw size={16} />
          بروزرسانی
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Shield size={40} className="mx-auto text-gray-300 mb-3" />
            رویداد امنیتی ثبت نشده است
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log, i) => (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-4 sm:p-5 flex items-start gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    log.status === "success"
                      ? "bg-green-100 text-green-600"
                      : log.status === "failed"
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {log.status === "success" ? (
                    <CheckCircle size={18} />
                  ) : log.status === "failed" ? (
                    <XCircle size={18} />
                  ) : (
                    <Clock size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {actionLabels[log.action] || log.action}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        severityColors[log.status] || severityColors.info
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>{new Date(log.createdAt).toLocaleString("fa-IR")}</span>
                    {log.ip && <span>IP: {log.ip}</span>}
                    {log.deviceId && (
                      <span>دستگاه: {log.deviceId.slice(0, 8)}...</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
