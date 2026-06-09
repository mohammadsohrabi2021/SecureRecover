// app/dashboard/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Key, 
  Activity, 
  Mail, 
  Phone, 
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Globe,
  LogOut,
  RefreshCw
} from 'lucide-react'

export default function Dashboard() {
  const [userData, setUserData] = useState({
    email: 'mohammadsohrabi141@gmail.com',
    phone: '09034007751',
    lastLogin: '1405/03/18 - 20:33:47',
    securityScore: 90
  })

  const [recoveryCodes, setRecoveryCodes] = useState([
    'XXXX-XXXX-XXXX-XXXX',
    'YYYY-YYYY-YYYY-YYYY',
    'ZZZZ-ZZZZ-ZZZZ-ZZZZ'
  ])

  const [activities, setActivities] = useState([
    { action: 'ورود موفق', device: 'Chrome - Windows', time: '20:33', ip: '192.168.1.1' },
    { action: 'تغییر رمز', device: 'Firefox - Windows', time: '15:20', ip: '192.168.1.1' },
    { action: 'ورود موفق', device: 'Safari - iPhone', time: '09:15', ip: '10.0.0.1' }
  ])

  const [strictMode, setStrictMode] = useState(false)

  const handleGenerateNewCodes = async () => {
    const res = await fetch('/api/auth/recovery-codes', { method: 'POST' })
    const data = await res.json()
    setRecoveryCodes(data.codes)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* هدر */}
      <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                SecureRecover
              </h1>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* بخش اصلی - گرید */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* پروفایل کاربر */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {userData.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">محمد سهرابی</h2>
                <p className="text-gray-400 text-sm">کاربر ویژه</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-xl">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">ایمیل</p>
                    <p className="text-white text-sm">{userData.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-xl">
                  <Phone className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">شماره تماس</p>
                    <p className="text-white text-sm">{userData.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-xl">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-xs text-gray-400">آخرین ورود</p>
                    <p className="text-white text-sm">{userData.lastLogin}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* بخش اصلی راست */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* کارت امتیاز امنیت */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-2xl border border-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  نمای کلی امنیت
                </h3>
                <button className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
                  مشاهده جزئیات <ChevronRight className="w-4 h-4 inline" />
                </button>
              </div>

              {/* دایره امتیاز */}
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="#374151" strokeWidth="8" fill="none"/>
                    <circle 
                      cx="64" cy="64" r="58" 
                      stroke="url(#gradient)" 
                      strokeWidth="8" 
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 58 * (userData.securityScore / 100)} ${2 * Math.PI * 58 * (1 - userData.securityScore / 100)}`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{userData.securityScore}%</span>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">امنیت حساب</span>
                    <span className="text-green-400 text-sm">عالی</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-gray-300">احراز هویت دو مرحله‌ای</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={strictMode}
                        onChange={(e) => setStrictMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* کدهای بازیابی */}
            <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-yellow-500" />
                  کدهای بازیابی
                </h3>
                <button 
                  onClick={handleGenerateNewCodes}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  تولید کد جدید
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recoveryCodes.map((code, idx) => (
                  <div key={idx} className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm text-gray-300 border border-gray-700">
                    {code}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                ⚠️ این کدها فقط یکبار قابل استفاده هستند. آنها را در جای امنی ذخیره کنید.
              </p>
            </div>

            {/* گزارش فعالیت‌ها */}
            <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-purple-500" />
                گزارش فعالیت‌ها
              </h3>

              <div className="space-y-3">
                {activities.map((activity, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/20 rounded-xl hover:bg-gray-700/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        {activity.action.includes('ورود') ? <Globe className="w-4 h-4 text-blue-400" /> : 
                         activity.action.includes('رمز') ? <Key className="w-4 h-4 text-yellow-400" /> :
                         <Smartphone className="w-4 h-4 text-green-400" />}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{activity.action}</p>
                        <p className="text-gray-400 text-xs">{activity.device} • {activity.ip}</p>
                      </div>
                    </div>
                    <span className="text-gray-500 text-sm">{activity.time}</span>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-2 text-center text-blue-400 hover:text-blue-300 text-sm transition-colors">
                مشاهده همه فعالیت‌ها
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* فوتر */}
      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          SecureRecover © 1404 - مرکز امنیت حساب کاربری
        </div>
      </footer>
    </div>
  )
}