import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "ثبت نام | SecureRecover",
  description: "ایجاد حساب کاربری جدید",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <RegisterForm />
    </div>
  );
}