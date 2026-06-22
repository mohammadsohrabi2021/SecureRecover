"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserCheck, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

const statusConfig = {
  pending: { label: "در انتظار", icon: Clock, className: "bg-amber-100 text-amber-800" },
  approved: { label: "تأیید شده", icon: CheckCircle, className: "bg-green-100 text-green-800" },
  denied: { label: "رد شده", icon: XCircle, className: "bg-red-100 text-red-800" },
  expired: { label: "منقضی", icon: AlertCircle, className: "bg-gray-100 text-gray-700" },
  blocked: { label: "مسدود", icon: XCircle, className: "bg-gray-900 text-white" },
};

const levelLabels = {
  HIGH: "بالا",
  MEDIUM: "متوسط",
  LOW: "پایین",
  CRITICAL: "بحرانی",
};

export default function LoginRequestsCard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/security/approval/my")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRequests(d.data?.requests || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse h-40" />
    );
  }

  if (requests.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <UserCheck size={18} className="text-violet-600" />
          درخواست‌های تأیید ورود
        </h3>
        <p className="text-xs text-gray-500 mt-1">تاریخچه درخواست‌های تأیید ادمین</p>
      </div>
      <div className="divide-y divide-gray-100">
        {requests.map((req) => {
          const cfg = statusConfig[req.status] || statusConfig.pending;
          const Icon = cfg.icon;
          return (
            <div key={req._id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
                  <Icon size={12} />
                  {cfg.label}
                </span>
                {req.trustLevel && (
                  <span className="text-xs text-violet-600 font-medium">
                    سطح اعتماد: {levelLabels[req.trustLevel] || req.trustLevel}
                    {req.trustScore != null && ` (${req.trustScore})`}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                <span>
                  درخواست: {new Date(req.requestedAt || req.createdAt).toLocaleString("fa-IR")}
                </span>
                {req.reviewedAt && (
                  <span>بررسی: {new Date(req.reviewedAt).toLocaleString("fa-IR")}</span>
                )}
              </div>
              {req.riskFactors?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {req.riskFactors.map((f) => (
                    <span key={f} className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
              )}
              {req.adminNote && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-2">
                  <span className="text-xs text-gray-400 block mb-1">یادداشت ادمین</span>
                  {req.adminNote}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
