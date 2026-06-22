"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Smartphone, Key, AlertTriangle, Activity, Clock } from "lucide-react";
import AdminStatCard from "@/components/admin/AdminStatCard";

export default function AdminInsightsPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/insights")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInsights(d.data.insights);
        else toast.error(d.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">بینش‌های امنیتی</h2>
        <p className="text-sm text-gray-500">دستگاه‌ها، کدهای بازیابی و رویدادهای اعتماد</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard icon={Smartphone} label="دستگاه‌های معتبر" value={insights?.devices?.total} color="blue" />
        <AdminStatCard icon={Key} label="کدهای بازیابی" value={insights?.recovery?.total} color="purple" />
        <AdminStatCard icon={Key} label="کدهای استفاده‌شده" value={insights?.recovery?.used} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            تأییدهای معلق
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {(insights?.pendingApprovals || []).length === 0 ? (
              <p className="text-sm text-gray-500">درخواست معلقی نیست</p>
            ) : (
              insights.pendingApprovals.map((a) => (
                <div key={a._id} className="text-sm border-b border-gray-50 pb-2">
                  <div className="flex justify-between">
                    <span>{a.userId?.name || a.identifier || "—"}</span>
                    <span className="text-amber-600 font-medium">{a.trustLevel || "LOW"}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(a.requestedAt || a.createdAt).toLocaleString("fa-IR")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            کاربران پرریسک
          </h3>
          <div className="space-y-3">
            {(insights?.topRiskUsers || []).length === 0 ? (
              <p className="text-sm text-gray-500">کاربر پرریسکی یافت نشد</p>
            ) : (
              insights.topRiskUsers.map((r) => (
                <div key={r._id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                  <span>{r.userId?.name || "—"}</span>
                  <span className="text-red-600 font-medium">{r.currentScore} ({r.level})</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" />
            رویدادهای اخیر اعتماد
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(insights?.recentTrustEvents || []).map((e) => (
              <div key={e._id} className="text-sm border-b border-gray-50 pb-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">{e.userId?.name || "—"}</span>
                  <span className={e.isSuccessful ? "text-green-600" : "text-red-600"}>
                    {e.isSuccessful ? "موفق" : "ناموفق"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  امتیاز: {e.score}
                  {e.scoreChange != null && e.scoreChange !== 0 && (
                    <span className={e.scoreChange > 0 ? " text-green-600" : " text-red-600"}>
                      {" "}({e.scoreChange > 0 ? "+" : ""}{e.scoreChange})
                    </span>
                  )}
                  {e.reason && ` — ${e.reason}`}
                </p>
                <p className="text-xs text-gray-400">
                  {e.ipAddress && `IP: ${e.ipAddress}`}
                  {e.deviceId && ` · دستگاه: ${e.deviceId.slice(0, 8)}…`}
                  {" · "}{new Date(e.createdAt).toLocaleString("fa-IR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
