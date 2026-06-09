"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardSidebar() {
  const pathname = usePathname();

  const linkStyle = (path) =>
    `block px-4 py-3 rounded-xl transition ${
      pathname === path
        ? "bg-blue-600 text-white shadow"
        : "text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <aside className="w-72 bg-white shadow-2xl p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-blue-600">
          SecureRecover
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          مرکز امنیت حساب کاربری
        </p>
      </div>

      <nav className="space-y-3">
        <Link href="/dashboard" className={linkStyle("/dashboard")}>
          نمای کلی امنیت
        </Link>

        <Link href="/dashboard/devices" className={linkStyle("/dashboard/devices")}>
          دستگاه‌های فعال
        </Link>

        <Link href="/dashboard/recovery" className={linkStyle("/dashboard/recovery")}>
          کدهای بازیابی
        </Link>

        <Link href="/dashboard/activity" className={linkStyle("/dashboard/activity")}>
          گزارش فعالیت‌ها
        </Link>
      </nav>
    </aside>
  );
}
