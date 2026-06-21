"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { registerSchema } from "@/lib/utils/validators";

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema)
  });
  
  async function onSubmit(data) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.message);
      }
      
      toast.success("ثبت نام با موفقیت انجام شد! لطفاً وارد شوید.");
      setTimeout(() => router.push("/login"), 1500);
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ثبت نام</h1>
        <p className="text-gray-500 text-sm">برای شروع، اطلاعات خود را وارد کنید</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          {...register("name")}
          label="نام کامل"
          placeholder="محمد سهرابی"
          dir='rtl'
          error={errors.name?.message}
        />
        
        <Input
          {...register("email")}
          label="ایمیل"
          type="email"
          placeholder="example@gmail.com"
          dir="ltr"
          error={errors.email?.message}
        />
        
        <Input
          {...register("phone")}
          label="شماره تلفن"
          placeholder="09123456789"
          dir="ltr"
          error={errors.phone?.message}
        />
        
        <Button type="submit" variant="primary" size="lg" className="cursor-pointer" fullWidth loading={loading}>
          ثبت نام
        </Button>
        
        <p className="text-center text-gray-500 text-sm mt-4">
          قبلاً ثبت نام کرده‌اید؟{" "}
          <a href="/login" className="text-blue-600 font-semibold hover:underline">
            وارد شوید
          </a>
        </p>
      </form>
    </motion.div>
  );
}