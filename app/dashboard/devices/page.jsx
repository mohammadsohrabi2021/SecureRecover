"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  Monitor,
  Tablet,
  Laptop,
  Trash2,
  Shield,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import TrustIndicator from "@/components/dashboard/TrustIndicator";

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/devices");
      const data = await res.json();
      if (res.ok) {
        setDevices(data.devices || data.data?.devices || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function revokeDevice(deviceId) {
    try {
      const res = await fetch(`/api/auth/devices/${deviceId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("دستگاه حذف شد");
        fetchDevices();
      } else {
        toast.error("خطا در حذف دستگاه");
      }
    } catch {
      toast.error("خطا در حذف دستگاه");
    }
  }

  function getIcon(type) {
    if (type === "mobile") return <Smartphone size={20} />;
    if (type === "tablet") return <Tablet size={20} />;
    if (type === "desktop") return <Monitor size={20} />;
    return <Laptop size={20} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield size={22} className="text-blue-600" />
            دستگاه‌های مورد اعتماد
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            دستگاه‌هایی که برای ورود سریع‌تر شناخته شده‌اند
          </p>
        </div>
        <button
          onClick={fetchDevices}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TrustIndicator />
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">{devices.length} دستگاه ثبت‌شده</h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">در حال بارگذاری...</div>
          ) : devices.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              هنوز دستگاه مورد اعتمادی ثبت نشده است
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {devices.map((device, i) => (
                <motion.div
                  key={device._id || device.deviceId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 flex items-center justify-between gap-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      {getIcon(device.deviceType)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{device.deviceName}</p>
                      <p className="text-xs text-gray-500">
                        {device.browser} · {device.os} · {device.loginCount || 0} ورود
                        {device.lastUsedIp && ` · IP: ${device.lastUsedIp}`}
                      </p>
                      {device.lastUsedAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          آخرین استفاده:{" "}
                          {new Date(device.lastUsedAt).toLocaleDateString("fa-IR")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle size={12} />
                      معتبر
                    </span>
                    <button
                      onClick={() => revokeDevice(device.deviceId)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      title="حذف دستگاه"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
