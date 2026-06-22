import Link from "next/link";
import { Shield } from "lucide-react";

const quickLinks = [
  { href: "/", label: "خانه" },
  { href: "/#features", label: "امکانات" },
  { href: "/dashboard", label: "داشبورد" },
  { href: "/login", label: "ورود امن" },
];

const securityLinks = [
  { href: "/dashboard", label: "امتیاز اعتماد" },
  { href: "/dashboard/security", label: "نشست‌های فعال" },
  { href: "/dashboard/recovery", label: "کدهای بازیابی" },
  { href: "/dashboard/activity", label: "لاگ‌های امنیتی" },
];

export default function Footer() {
  return (
    <footer dir="rtl" className="bg-slate-950 text-slate-300 border-t border-violet-500/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 pb-12 border-b border-slate-800">
          {/* برند */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <span className="text-lg font-black text-white">SecureRecover</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              سامانه احراز هویت و بازیابی حساب بدون رمز عبور — با OTP، امتیاز اعتماد پویا
              و تأیید ادمین برای ورودهای پرریسک.
            </p>
          </div>

          {/* دسترسی سریع */}
          <div>
            <h3 className="font-bold text-white mb-5 text-sm">دسترسی سریع</h3>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-violet-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* امنیت */}
          <div>
            <h3 className="font-bold text-white mb-5 text-sm">امنیت</h3>
            <ul className="space-y-3 text-sm">
              {securityLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-violet-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 text-center">
          <p className="text-slate-500 text-xs">
            © ۲۰۲۶ SecureRecover — تمامی حقوق محفوظ است.
          </p>
        </div>
      </div>
    </footer>
  );
}
