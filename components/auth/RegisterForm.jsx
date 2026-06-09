"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(3, "نام باید حداقل ۳ کاراکتر باشد"),
  email: z.string().email("ایمیل وارد شده معتبر نیست"),
  phone: z.string().min(11, "شماره تلفن باید ۱۱ رقم باشد و با ۰۹ شروع شود"),
});

export default function RegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data) {

    const loadingToast = toast.loading("در حال ایجاد حساب...");

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });

      toast.success("ثبت نام با موفقیت انجام شد ✅", {
        id: loadingToast,
      });

      router.push("/login");

    } catch (err) {

      toast.error(err.message || "خطایی در ثبت نام رخ داد", {
        id: loadingToast,
      });

    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/90 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] border border-white"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">ایجاد حساب جدید</h1>
        <p className="text-gray-500 text-sm">به جمع کاربران SecureRecover بپیوندید</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-right" dir="rtl">
        
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-gray-700 mr-1">نام و نام خانوادگی</label>
          <input
            {...register("name")}
            type="text"
            placeholder="مثلاً: محمد سهرابی"
            className={`w-full px-5 py-3.5 rounded-2xl bg-gray-50/50 border-2 transition-all outline-none ${
              errors.name ? "border-red-100 focus:border-red-500" : "border-transparent focus:border-blue-500 focus:bg-white"
            }`}
          />
          {errors.name && <p className="text-red-500 text-[11px] mt-1 mr-1">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-gray-700 mr-1">پست الکترونیک</label>
          <input
            {...register("email")}
            type="email"
            placeholder="name@example.com"
            className={`w-full px-5 py-3.5 rounded-2xl bg-gray-50/50 border-2 transition-all outline-none text-left ${
              errors.email ? "border-red-100 focus:border-red-500" : "border-transparent focus:border-blue-500 focus:bg-white"
            }`}
          />
          {errors.email && <p className="text-red-500 text-[11px] mt-1 mr-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-gray-700 mr-1">تلفن </label>
          <input
            {...register("phone")}
            type="phone"
            placeholder="09039443966"
            className={`w-full px-5 py-3.5 rounded-2xl bg-gray-50/50 border-2 transition-all outline-none text-left ${
              errors.phone ? "border-red-100 focus:border-red-500" : "border-transparent focus:border-blue-500 focus:bg-white"
            }`}
          />
          {errors.phone && <p className="text-red-500 text-[11px] mt-1 mr-1">{errors.phone.message}</p>}
        </div>

        <button
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-100 hover:shadow-blue-200 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-70 mt-4"
        >
          {isSubmitting ? "در حال ثبت‌نام..." : "ساخت حساب کاربری"}
        </button>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <a href="/login" className="text-blue-600 font-bold hover:underline">وارد شوید</a>
          </p>
        </div>
      </form>
    </motion.div>
  );
}
