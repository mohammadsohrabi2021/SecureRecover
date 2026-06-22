"use client";

import { motion } from "framer-motion";
import {
  Fingerprint,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Activity,
  Lock,
  ScrollText,
} from "lucide-react";

const features = [
  {
    title: "ورود بدون رمز عبور",
    description:
      "احراز هویت با OTP از طریق ایمیل یا موبایل — بدون نگهداری، نشت یا فراموشی رمز عبور.",
    icon: Fingerprint,
    className: "md:col-span-2 md:row-span-2 bg-gradient-to-br from-violet-600 to-indigo-700 text-white",
    iconClass: "text-violet-200",
    large: true,
  },
  {
    title: "امتیاز اعتماد پویا",
    description: "تحلیل دستگاه، مکان و رفتار ورود؛ سطح امنیت موردنیاز به‌صورت هوشمند تنظیم می‌شود.",
    icon: Activity,
    className: "bg-white border border-slate-200 shadow-sm",
    iconClass: "text-violet-600",
  },
  {
    title: "تأیید ادمین برای ورودهای پرریسک",
    description: "مسیر جایگزین امن وقتی کد بازیابی در دسترس نیست — با توکن یکبارمصرف و ثبت ممیزی.",
    icon: UserCheck,
    className: "bg-white border border-slate-200 shadow-sm",
    iconClass: "text-indigo-600",
  },
  {
    title: "کدهای بازیابی امن",
    description: "کدهای پشتیبان هش‌شده برای ورودهای کم‌اعتماد؛ فقط یک‌بار نمایش داده می‌شوند.",
    icon: KeyRound,
    className: "bg-slate-50 border border-slate-200",
    iconClass: "text-slate-700",
  },
  {
    title: "مدیریت نشست‌ها",
    description: "مشاهده و لغو نشست‌های فعال؛ نشست فعلی از لغو تصادفی محافظت می‌شود.",
    icon: Lock,
    className: "bg-slate-900 text-white",
    iconClass: "text-violet-400",
  },
  {
    title: "گزارش‌ها و لاگ‌های امنیتی",
    description: "ردپای کامل رویدادهای ورود، OTP، لغو نشست و تصمیمات ادمین برای ممیزی امنیتی.",
    icon: ScrollText,
    className: "md:col-span-2 bg-white border border-slate-200 shadow-sm",
    iconClass: "text-violet-600",
  },
];

export default function FeaturesBento() {
  return (
    <section id="features" dir="rtl" className="py-24 lg:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-violet-600 mb-3">امکانات سامانه</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            امنیتی که با هر ورود تطبیق می‌یابد
          </h2>
          <p className="text-slate-600 leading-relaxed">
            از ورود مستقیم با اعتماد بالا تا OTP، کد بازیابی و تأیید ادمین — هر لایه با هوشمندی فعال می‌شود.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-5 auto-rows-fr">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const isDark =
              feature.className.includes("slate-900") ||
              feature.className.includes("violet-600");

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className={`rounded-2xl p-6 lg:p-8 flex flex-col text-right ${feature.className} ${feature.large ? "min-h-[280px]" : "min-h-[180px]"}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                    isDark ? "bg-white/10" : "bg-violet-50"
                  }`}
                >
                  <Icon size={24} className={feature.iconClass} />
                </div>
                <h3 className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm leading-relaxed flex-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {feature.description}
                </p>
                {feature.large && (
                  <div className="mt-6 flex items-center gap-2 text-violet-200 text-sm">
                    <ShieldCheck size={16} />
                    <span>مورد اعتماد تیم‌های امنیتی</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
