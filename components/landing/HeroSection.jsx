"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Sparkles } from "lucide-react";
import SecurityGrid from "./SecurityGrid";

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 400 320"
      className="w-full max-w-md mx-auto drop-shadow-2xl"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="160" r="120" fill="none" stroke="url(#ringGrad)" strokeWidth="1.5" />
      <circle cx="200" cy="160" r="90" fill="none" stroke="url(#ringGrad)" strokeWidth="1" opacity="0.6" />
      <circle cx="200" cy="160" r="60" fill="none" stroke="url(#ringGrad)" strokeWidth="0.5" opacity="0.4" />
      <path
        d="M200 80 L260 110 V170 C260 210 200 240 200 240 C200 240 140 210 140 170 V110 Z"
        fill="url(#shieldGrad)"
        opacity="0.9"
      />
      <path
        d="M200 115 L230 130 V170 C230 195 200 210 200 210 C200 210 170 195 170 170 V130 Z"
        fill="#0f172a"
        opacity="0.3"
      />
      <circle cx="120" cy="100" r="4" fill="#8b5cf6" opacity="0.8" />
      <circle cx="290" cy="130" r="3" fill="#6366f1" opacity="0.6" />
      <circle cx="310" cy="220" r="5" fill="#8b5cf6" opacity="0.5" />
      <circle cx="90" cy="200" r="3" fill="#6366f1" opacity="0.7" />
    </svg>
  );
}

export default function HeroSection() {
  return (
    <section
      dir="rtl"
      className="relative min-h-[88vh] flex items-center overflow-hidden bg-slate-950 text-white"
    >
      <SecurityGrid />

      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-right order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-8"
            >
              <Sparkles size={14} />
              <span>احراز هویت سازمانی بدون رمز عبور</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.25] mb-6"
            >
              بازیابی امن حساب،
              <span className="block mt-2 bg-gradient-to-l from-violet-400 via-indigo-400 to-violet-300 bg-clip-text text-transparent">
                بدون وابستگی به رمز عبور
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10"
            >
              SecureRecover یک سامانه احراز هویت و بازیابی حساب مبتنی بر OTP، کد بازیابی،
              امتیاز اعتماد پویا و تأیید ادمین است.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/login"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-l from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all duration-300"
              >
                <span className="absolute inset-0 rounded-xl bg-gradient-to-l from-violet-400 to-indigo-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
                <span className="relative">شروع ورود امن</span>
                <ArrowLeft size={18} className="relative group-hover:-translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white hover:bg-slate-900/50 transition-all"
              >
                <Shield size={18} />
                مشاهده امکانات
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-6 mt-12 justify-center lg:justify-start text-sm text-slate-500"
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                بدون ذخیره رمز عبور
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                امتیاز اعتماد تطبیقی
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <HeroIllustration />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
