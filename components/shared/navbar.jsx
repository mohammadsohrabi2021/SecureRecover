"use client"

import Link from "next/link"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md shadow-sm shadow-blue-100/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4 flex-row">
        
        {/* لوگو سمت راست */}
        <Link href="/" className="text-2xl font-black bg-gradient-to-l from-blue-700 to-indigo-600 bg-clip-text text-transparent hover:scale-105 transition">
          سامانه بازیابی امن
        </Link>

        {/* منوهای وسط و چپ */}
        <div className="hidden md:flex items-center gap-10">
          <nav className="flex items-center gap-8 text-sm font-semibold text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition relative after:content-[''] after:absolute after:-bottom-1 after:right-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all">خانه</Link>
            <Link href="#features" className="hover:text-blue-600 transition relative after:content-[''] after:absolute after:-bottom-1 after:right-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all">ویژگی‌ها</Link>
            <Link href="#security" className="hover:text-blue-600 transition relative after:content-[''] after:absolute after:-bottom-1 after:right-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all">امنیت</Link>
            <Link href="#about" className="hover:text-blue-600 transition relative after:content-[''] after:absolute after:-bottom-1 after:right-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all">درباره ما</Link>
          </nav>

          <div className="flex items-center gap-4 border-r pr-8 border-gray-100">
            <Link href="/login" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition">ورود</Link>
            <Link href="/register" className="px-6 py-2.5 rounded-xl text-white font-bold bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-200/50 hover:shadow-blue-300/60 hover:-translate-y-0.5 transition active:scale-95 text-sm">شروع رایگان</Link>
          </div>
        </div>

      </div>
    </header>
  )
}
