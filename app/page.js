"use client"

import Header from "@/components/shared/navbar"
import Footer from "@/components/shared/footer"
import Link from "next/link"
import { motion } from "framer-motion"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">

      <Header />

      <main className="flex-1">

        <section className="relative py-32 bg-gradient-to-b from-blue-50 via-white to-indigo-50 overflow-hidden">

          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[750px] bg-blue-200/30 blur-3xl rounded-full"></div>

          <div className="max-w-6xl mx-auto px-6 text-center relative">

            <motion.h1 initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900 mb-6">
              ورود امن
              <span className="block text-blue-600 mt-3">
                بدون نیاز به گذرواژه
              </span>
            </motion.h1>

            <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}} className="max-w-2xl mx-auto text-lg text-gray-600 leading-relaxed mb-12">
              این سامانه با استفاده از رمز یکبار مصرف، کدهای بازیابی و ثبت رویدادهای امنیتی از حساب کاربری شما محافظت می‌کند و تجربه‌ای ساده و امن برای ورود فراهم می‌سازد.
            </motion.p>

            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="flex flex-wrap justify-center gap-4">

              <Link href="/register" className="px-8 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-200/60 hover:scale-105 hover:shadow-xl transition">
                ایجاد حساب کاربری
              </Link>

              <Link href="/login" className="px-8 py-3 rounded-xl bg-white shadow-md shadow-gray-200/70 hover:shadow-lg hover:scale-105 transition">
                ورود به حساب
              </Link>

            </motion.div>

          </div>

        </section>



        <section className="py-24 bg-white">

          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">

            <FeatureCard
              title="ورود با رمز یکبار مصرف"
              text="برای ورود به حساب دیگر نیازی به نگهداری گذرواژه نیست و احراز هویت با رمز موقت انجام می‌شود."
              delay={0}
            />

            <FeatureCard
              title="کدهای بازیابی"
              text="در صورت از دست دادن دسترسی می‌توانید با استفاده از کدهای بازیابی وارد حساب خود شوید."
              delay={0.15}
            />

            <FeatureCard
              title="گزارش رویدادهای امنیتی"
              text="تمامی فعالیت‌های ورود و نشست‌های فعال ثبت می‌شوند تا امنیت حساب قابل بررسی باشد."
              delay={0.3}
            />

          </div>

        </section>



        <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">

          <motion.div initial={{opacity:0}} whileInView={{opacity:1}} transition={{duration:0.6}} className="max-w-3xl mx-auto px-6 text-center">

            <h2 className="text-3xl md:text-4xl font-bold mb-5">
              امنیت حساب خود را جدی بگیرید
            </h2>

            <p className="opacity-90 mb-10 text-lg">
              با استفاده از این سامانه می‌توانید بدون نگرانی از لو رفتن گذرواژه وارد حساب کاربری خود شوید.
            </p>

            <Link href="/register" className="bg-white text-blue-600 px-8 py-3 rounded-xl font-medium shadow-lg shadow-blue-900/20 hover:scale-105 hover:shadow-xl transition">
              ساخت حساب کاربری
            </Link>

          </motion.div>

        </section>

      </main>

      <Footer />

    </div>
  )
}



function FeatureCard({ title, text, delay }) {
  return (
    <motion.div initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} transition={{delay}} whileHover={{y:-8}} className="bg-white p-8 rounded-2xl shadow-lg shadow-gray-200/60 hover:shadow-xl hover:shadow-gray-300/60 transition">

      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {title}
      </h3>

      <p className="text-gray-600 leading-relaxed">
        {text}
      </p>

    </motion.div>
  )
}
