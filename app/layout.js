import "./globals.css";
import { Toaster } from "react-hot-toast";



export const metadata = {
  title: "SecureRecover - احراز هویت امن",
  description: "سیستم احراز هویت بدون رمز عبور با امتیازدهی پویا",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              direction: "rtl",
              fontFamily: "inherit",
            },
          }}
        />
      </body>
    </html>
  );
}