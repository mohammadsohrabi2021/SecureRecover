"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";

const navLinks = [
  { href: "/", label: "خانه" },
  { href: "/#features", label: "امکانات" },
  { href: "/#security", label: "امنیت" },
];

export default function Header() {
  const { user, loading, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "؟";

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-50 w-full bg-slate-950/85 backdrop-blur-md border-b border-violet-500/10 shadow-lg shadow-black/5"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* لوگو — سمت راست در RTL */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
            <Shield size={18} className="text-white" />
          </div>
          <span className="text-lg sm:text-xl font-black bg-gradient-to-l from-violet-300 to-indigo-300 bg-clip-text text-transparent">
            SecureRecover
          </span>
        </Link>

        {/* ناوبری دسکتاپ */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-violet-300 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className="hover:text-violet-300 transition-colors"
            >
              پنل کاربری
            </Link>
          )}
        </nav>

        {/* احراز هویت — دسکتاپ */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="w-28 h-10 bg-slate-800 rounded-xl animate-pulse" />
          ) : isAuthenticated ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200 px-3 py-2 rounded-lg hover:bg-violet-500/10 transition"
                >
                  <Shield size={16} />
                  پنل ادمین
                </Link>
              )}
              <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-semibold text-white leading-tight">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-sm text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg transition"
              >
                <LogOut size={16} />
                خروج
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-l from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all"
            >
              ورود امن
            </Link>
          )}
        </div>

        {/* منوی موبایل */}
        <button
          className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800 transition"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="باز کردن منو"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2.5 text-slate-300 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {!loading && isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 py-4 border-y border-slate-800 my-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                  {initials}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 py-2.5 text-slate-300"
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard size={16} />
                پنل کاربری
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 py-2.5 text-violet-300"
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield size={16} />
                  پنل ادمین
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="flex items-center gap-2 py-2.5 text-red-400 w-full"
              >
                <LogOut size={16} />
                خروج
              </button>
            </>
          ) : (
            !loading && (
              <Link
                href="/login"
                className="block py-3 mt-2 text-center rounded-xl bg-gradient-to-l from-violet-600 to-indigo-600 text-white font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                ورود امن
              </Link>
            )
          )}
        </div>
      )}
    </header>
  );
}
