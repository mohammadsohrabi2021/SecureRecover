"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Monitor,
  Shield,
  FileText,
  AlertTriangle,
  BarChart3,
  Menu,
  X,
  LogOut,
  Home,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";

const NAV = [
  { href: "/admin", label: "نمای کلی", icon: LayoutDashboard },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/sessions", label: "جلسات", icon: Monitor },
  { href: "/admin/trust", label: "امتیاز اعتماد", icon: Shield },
  { href: "/admin/logs", label: "لاگ‌ها", icon: FileText },
  { href: "/admin/approvals", label: "تأییدها", icon: AlertTriangle },
  { href: "/admin/insights", label: "بینش‌ها", icon: BarChart3 },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { user, loading, isAdmin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <Shield size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">دسترسی غیرمجاز</h1>
          <p className="text-gray-500 mb-6">فقط ادمین‌ها به این بخش دسترسی دارند.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            بازگشت به داشبورد
          </Link>
        </div>
      </div>
    );
  }

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? "" : "hidden lg:flex"} flex-col w-64 bg-white border-l border-gray-200 shrink-0`}>
      <div className="p-5 border-b border-gray-100">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900">پنل ادمین</p>
            <p className="text-xs text-gray-500">SecureRecover</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => mobile && setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-100 space-y-1">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg">
          <Home size={16} /> صفحه اصلی
        </Link>
        <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg">
          <LayoutDashboard size={16} /> داشبورد کاربر
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full"
        >
          <LogOut size={16} /> خروج
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Sidebar />

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-bold text-gray-900 text-sm sm:text-base">مدیریت سیستم</h1>
              <p className="text-xs text-gray-500 hidden sm:block">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              ادمین
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
              {user?.name?.charAt(0) || "A"}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
