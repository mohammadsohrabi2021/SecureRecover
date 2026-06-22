"use client";

import { motion } from "framer-motion";
import { Lock, Zap, Shield, Eye, Server } from "lucide-react";

const badges = [
  { label: "رمزنگاری سرتاسری", icon: Lock },
  { label: "پایش لحظه‌ای", icon: Eye },
  { label: "امنیت تطبیقی", icon: Zap },
  { label: "ردپای ممیزی", icon: Shield },
  { label: "آماده Zero Trust", icon: Server },
];

export default function TrustBadges() {
  return (
    <section id="security" dir="rtl" className="py-16 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-sm font-medium text-slate-500 mb-10">
          ساخته‌شده بر پایه اصول امنیت‌محور
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
          {badges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex flex-col items-center text-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors duration-300">
                  <Icon size={26} strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-slate-700">{badge.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
