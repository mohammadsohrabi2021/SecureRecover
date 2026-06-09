import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#fbfcfd] overflow-hidden">
      
      {/* المان‌های بصری پس‌زمینه */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-50/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-50/50 rounded-full blur-[120px]" />

      <div className="w-full max-w-[500px] px-6 relative z-10">
        <RegisterForm />
      </div>
    </div>
  );
}
