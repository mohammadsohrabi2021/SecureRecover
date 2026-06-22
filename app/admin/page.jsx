"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Monitor,
  AlertTriangle,
  Shield,
  Activity,
  TrendingDown,
  Clock,
} from "lucide-react";
import AdminStatCard from "@/components/admin/AdminStatCard";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data.stats);
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
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">نمای کلی</h2>
        <p className="text-gray-500 text-sm mt-1">وضعیت کلی سیستم احراز هویت</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AdminStatCard icon={Users} label="کل کاربران" value={stats?.totalUsers} color="blue" />
        <AdminStatCard icon={Activity} label="کاربران فعال" value={stats?.activeUsers} color="green" />
        <AdminStatCard icon={Monitor} label="جلسات فعال" value={stats?.activeSessions} color="purple" />
        <AdminStatCard icon={AlertTriangle} label="تأییدهای معلق" value={stats?.pendingApprovals} color="amber" />
        <AdminStatCard icon={TrendingDown} label="اعتماد پایین" value={stats?.lowTrustUsers} color="red" />
        <AdminStatCard icon={Shield} label="رویداد مشکوک" value={stats?.suspiciousEvents} color="orange" />
        <AdminStatCard icon={Clock} label="خطای ۲۴ساعت" value={stats?.failedLogins24h} color="red" />
        <AdminStatCard icon={Users} label="ادمین‌ها" value={stats?.adminUsers} color="indigo" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: "/admin/users", title: "مدیریت کاربران", desc: "فعال/غیرفعال، جستجو، امتیاز اعتماد" },
          { href: "/admin/sessions", title: "جلسات فعال", desc: "مشاهده و بستن جلسات" },
          { href: "/admin/trust", title: "امتیاز اعتماد", desc: "پایش سطح HIGH/MEDIUM/LOW/CRITICAL" },
          { href: "/admin/logs", title: "لاگ امنیتی", desc: "ورود، OTP، بازیابی، مسدودسازی" },
          { href: "/admin/approvals", title: "تأیید ورود", desc: "درخواست‌های CRITICAL risk" },
          { href: "/admin/insights", title: "بینش‌ها", desc: "دستگاه‌ها، کدهای بازیابی، ریسک" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block p-5 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition"
          >
            <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
