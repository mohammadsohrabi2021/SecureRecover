export default function Footer() {
    return (
      <footer className="bg-white pt-16 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-gray-50 flex-row-reverse">
            
            {/* بخش برندینگ - سمت راست */}
            <div className="md:col-span-1 text-right">
              <h2 className="text-xl font-black text-blue-600 mb-4">سامانه بازیابی امن</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                ارائه‌دهنده راهکارهای نوین احراز هویت بدون گذرواژه برای ارتقای امنیت و تجربه کاربری در فضای دیجیتال.
              </p>
            </div>
  
            {/* لینک‌های سریع */}
            <div className="text-right">
              <h3 className="font-bold text-gray-900 mb-6 text-sm">دسترسی سریع</h3>
              <ul className="space-y-4 text-gray-500 text-sm">
                <li><a href="#" className="hover:text-blue-600 transition">ویژگی‌های سامانه</a></li>
                <li><a href="#" className="hover:text-blue-600 transition">مستندات امنیتی</a></li>
                <li><a href="#" className="hover:text-blue-600 transition">سوالات متداول</a></li>
              </ul>
            </div>
  
            {/* بخش پشتیبانی */}
            <div className="text-right">
              <h3 className="font-bold text-gray-900 mb-6 text-sm">پشتیبانی</h3>
              <ul className="space-y-4 text-gray-500 text-sm">
                <li><a href="#" className="hover:text-blue-600 transition">تماس با ما</a></li>
                <li><a href="#" className="hover:text-blue-600 transition">گزارش مشکل امنیتی</a></li>
                <li><a href="#" className="hover:text-blue-600 transition">قوانین و مقررات</a></li>
              </ul>
            </div>
  
            {/* شبکه‌های اجتماعی و خبرنامه */}
            <div className="text-right">
              <h3 className="font-bold text-gray-900 mb-6 text-sm">همراه ما باشید</h3>
              <div className="flex gap-4 justify-end">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer transition">
                  <span className="text-xs">تلگرام</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer transition">
                  <span className="text-xs">ایتا</span>
                </div>
              </div>
            </div>
  
          </div>
  
          {/* کپی‌رایت نهایی */}
          <div className="pt-8 text-center">
            <p className="text-gray-400 text-xs font-medium">
               تمامی حقوق برای سامانه بازیابی امن محفوظ است © {new Date().getFullYear()}
            </p>
          </div>
  
        </div>
      </footer>
    );
  }
  