"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function CtaSection() {
  return (
    <section dir="rtl" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-slate-900" />
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-dots)" />
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            آماده حذف رمز عبور
            <span className="block text-violet-200 mt-2">از فرآیند احراز هویت خود هستید؟</span>
          </h2>
          <p className="text-lg text-violet-100/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            همین حالا حساب بسازید و تجربه ورود امن با امتیاز اعتماد پویا را آغاز کنید.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold text-violet-700 bg-white hover:bg-violet-50 shadow-xl shadow-black/20 hover:scale-[1.02] transition-all"
            >
              ایجاد حساب رایگان
              <ArrowLeft size={18} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-semibold text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/10 transition-all"
            >
              ورود امن
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
