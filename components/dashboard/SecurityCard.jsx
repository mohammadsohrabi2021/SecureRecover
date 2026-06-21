"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function SecurityCard() {
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const generateRecoveryCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recovery/generate", {
        method: "POST"
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message);
      }
      
      setRecoveryCodes(data.data?.recoveryCodes || []);
      setShowRecoveryModal(true);
      toast.success("کدهای بازیابی جدید تولید شد");
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const revokeAllSessions = async () => {
    if (!confirm("آیا از خروج از تمام دستگاه‌های دیگر مطمئن هستید؟")) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sessions/revoke-all", {
        method: "POST"
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message);
      }
      
      toast.success("تمام جلسات دیگر بسته شد");
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4">امنیت حساب</h3>
        
        <div className="space-y-3">
          <button
            onClick={generateRecoveryCodes}
            disabled={loading}
            className="w-full text-right px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">کدهای بازیابی</p>
                <p className="text-xs text-gray-500">تولید کدهای جدید برای بازیابی حساب</p>
              </div>
              <span className="text-blue-600">←</span>
            </div>
          </button>
          
          <button
            onClick={revokeAllSessions}
            disabled={loading}
            className="w-full text-right px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">خروج از تمام دستگاه‌ها</p>
                <p className="text-xs text-gray-500">بستن تمام جلسات فعال دیگر</p>
              </div>
              <span className="text-red-600">←</span>
            </div>
          </button>
        </div>
      </Card>
      
      {/* Modal Recovery Codes */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">کدهای بازیابی</h3>
            <p className="text-gray-500 text-sm mb-4">
              این کدها فقط یک بار نمایش داده می‌شوند. لطفاً آن‌ها را در جای امن ذخیره کنید.
            </p>
            
            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, index) => (
                  <div key={index} className="font-mono text-sm bg-white p-2 rounded text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  navigator.clipboard.writeText(recoveryCodes.join("\n"));
                  toast.success("کدها کپی شد");
                }}
              >
                کپی همه
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowRecoveryModal(false)}
              >
                بستن
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}