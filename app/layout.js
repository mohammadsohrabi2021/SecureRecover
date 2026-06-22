import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "SecureRecover - احراز هویت امن",
  description: "سیستم احراز هویت بدون رمز عبور با امتیازدهی پویا",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className={inter.variable}>
      <body className="antialiased font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: { direction: "rtl", fontFamily: "inherit" },
          }}
        />
      </body>
    </html>
  );
}