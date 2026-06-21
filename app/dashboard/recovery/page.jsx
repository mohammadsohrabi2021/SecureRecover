"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Copy,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Printer,
  ChevronRight,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

export default function RecoveryCodesPage() {
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [showCodes, setShowCodes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codesGenerated, setCodesGenerated] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showWarning, setShowWarning] = useState(true);
  const [codesStatus, setCodesStatus] = useState(null);

  useEffect(() => {
    fetchCodesStatus();
    // بررسی وجود کدهای جدید در localStorage
    const newCodes = localStorage.getItem("newRecoveryCodes");
    if (newCodes) {
      setRecoveryCodes(JSON.parse(newCodes));
      setShowCodes(true);
      setCodesGenerated(true);
      localStorage.removeItem("newRecoveryCodes");
    }
  }, []);

  const fetchCodesStatus = async () => {
    try {
      const res = await fetch("/api/recovery/status");
      const data = await res.json();
      if (res.ok) {
        setCodesStatus(data.data);
      }
    } catch (error) {
      console.error("Error fetching codes status:", error);
    }
  };

  const generateCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recovery/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setRecoveryCodes(data.data?.recoveryCodes || []);
      setShowCodes(true);
      setCodesGenerated(true);
      setShowWarning(true);
      toast.success("کدهای بازیابی جدید تولید شد");
      await fetchCodesStatus();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copySingleCode = async (code, index) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      toast.success("کد کپی شد");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast.error("خطا در کپی کردن");
    }
  };

  const copyAllCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      toast.success("همه کدها کپی شدند");
    } catch (err) {
      toast.error("خطا در کپی کردن");
    }
  };

  const downloadCodes = () => {
    const blob = new Blob([recoveryCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recovery-codes-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("فایل ذخیره شد");
  };

  const printCodes = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>کدهای بازیابی - SecureRecover</title>
          <style>
            body {
              font-family: 'Tahoma', sans-serif;
              padding: 40px;
              text-align: center;
              direction: rtl;
            }
            h1 { color: #1e40af; margin-bottom: 10px; }
            .warning {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 10px;
            }
            .codes {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              margin: 30px 0;
            }
            .code {
              font-family: monospace;
              font-size: 16px;
              padding: 10px;
              background: #f3f4f6;
              border-radius: 8px;
              letter-spacing: 2px;
            }
            .footer {
              margin-top: 30px;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <h1>🔐 کدهای بازیابی SecureRecover</h1>
          <div class="warning">
            ⚠️ این کدها فقط یک بار نمایش داده می‌شوند. لطفاً آن‌ها را در جای امن نگهداری کنید.
          </div>
          <div class="codes">
            ${recoveryCodes
              .map((code) => `<div class="code">${code}</div>`)
              .join("")}
          </div>
          <div class="footer">
            تاریخ تولید: ${new Date().toLocaleDateString("fa-IR")}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="text-blue-600" size={28} />
            کدهای بازیابی
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            کدهای یکبار مصرف برای بازیابی حساب کاربری در مواقع ضروری
          </p>
        </div>
        {codesStatus && (
          <div className="flex gap-2">
            <div className="bg-green-50 px-3 py-1.5 rounded-full">
              <span className="text-green-600 text-sm font-medium">
                {codesStatus.available} کد فعال
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Warning Banner */}
      <AnimatePresence>
        {showWarning && codesGenerated && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle
              className="text-amber-600 flex-shrink-0 mt-0.5"
              size={20}
            />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 text-sm">
                ⚠️ نکته مهم امنیتی
              </p>
              <p className="text-amber-700 text-sm mt-1">
                این کدها فقط یک بار نمایش داده می‌شوند. لطفاً آن‌ها را در جای
                امن ذخیره کنید. هر کد فقط یک بار قابل استفاده است.
              </p>
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="text-amber-600 hover:text-amber-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">امنیت حساب</p>
              <p className="text-sm font-bold text-blue-900">بازیابی امن</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">یکبار مصرف</p>
              <p className="text-sm font-bold text-green-900">
                هر کد فقط یک بار
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Clock size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-purple-600 font-medium">
                اعتبار طولانی
              </p>
              <p className="text-sm font-bold text-purple-900">یک سال اعتبار</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">کدهای بازیابی شما</h3>
            <p className="text-xs text-gray-500 mt-1">
              ۱۰ کد یکبار مصرف برای مواقع اضطراری
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generateCodes}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  در حال تولید...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  تولید کدهای جدید
                </>
              )}
            </button>
          </div>
        </div>

        {/* Codes Display */}
        {showCodes && recoveryCodes.length > 0 ? (
          <div className="p-5">
            {/* Codes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {recoveryCodes.map((code, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="group relative"
                >
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200 hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <Key size={12} className="text-blue-600" />
                        </div>
                        <span className="font-mono text-sm md:text-base font-bold text-gray-800 tracking-wider">
                          {code}
                        </span>
                      </div>
                      <button
                        onClick={() => copySingleCode(code, index)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                        title="کپی کد"
                      >
                        {copiedIndex === index ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={copyAllCodes}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy size={16} />
                کپی همه کدها
              </button>
              <button
                onClick={downloadCodes}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={16} />
                دانلود فایل
              </button>
              <button
                onClick={printCodes}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={16} />
                چاپ کدها
              </button>
            </div>

            {/* Security Tip */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <Shield
                  size={18}
                  className="text-blue-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="font-semibold text-blue-800 text-sm">
                    نکته امنیتی
                  </p>
                  <p className="text-blue-700 text-xs mt-1">
                    کدهای بازیابی را در جای امن مانند یک password manager ذخیره
                    کنید. هرگز کدها را با کسی به اشتراک نگذارید.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              کدهای بازیابی ندارید
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              با تولید کدهای بازیابی، می‌توانید در مواقع ضروری به حساب خود
              دسترسی داشته باشید.
            </p>
            <button
              onClick={generateCodes}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 mx-auto cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  در حال تولید...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  تولید کدهای بازیابی
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>

      {/* Usage Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
      >
        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <ChevronRight size={18} className="text-blue-600" />
          نحوه استفاده از کدهای بازیابی
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-xs font-bold">1</span>
            </div>
            <p className="text-gray-600 text-sm">
              در صفحه لاگین، گزینه "ورود با کد بازیابی" را انتخاب کنید
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-xs font-bold">2</span>
            </div>
            <p className="text-gray-600 text-sm">
              یکی از کدهای بازیابی را وارد کنید
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-xs font-bold">3</span>
            </div>
            <p className="text-gray-600 text-sm">
              پس از استفاده، کد غیرفعال می‌شود و باید کد جدیدی تولید کنید
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
