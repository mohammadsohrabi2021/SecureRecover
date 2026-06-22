"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminTable from "@/components/admin/AdminTable";

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sessions");
      const data = await res.json();
      if (res.ok) setSessions(data.data.sessions || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  async function revoke(sessionId) {
    if (!confirm("آیا از بستن این جلسه مطمئن هستید؟")) return;
    const res = await fetch("/api/admin/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("جلسه بسته شد");
      fetchSessions();
    } else toast.error(data.message);
  }

  const columns = [
    { key: "user", label: "کاربر", render: (r) => r.userId?.name || "—" },
    { key: "email", label: "ایمیل", render: (r) => r.userId?.email || "—" },
    { key: "device", label: "دستگاه", render: (r) => r.deviceName || r.deviceId?.slice(0, 12) },
    { key: "browser", label: "مرورگر", render: (r) => r.browser || "—" },
    { key: "os", label: "OS", render: (r) => r.os || "—" },
    { key: "ip", label: "IP", render: (r) => r.ip || "—" },
    {
      key: "location",
      label: "مکان",
      render: (r) =>
        r.location?.city ? `${r.location.city}${r.location.country ? `, ${r.location.country}` : ""}` : "—",
    },
    {
      key: "expiresAt",
      label: "انقضا",
      render: (r) =>
        r.expiresAt ? new Date(r.expiresAt).toLocaleString("fa-IR") : "—",
    },
    {
      key: "lastActive",
      label: "آخرین فعالیت",
      render: (r) =>
        r.lastActive ? new Date(r.lastActive).toLocaleString("fa-IR") : "—",
    },
    {
      key: "actions",
      label: "عملیات",
      render: (r) => (
        <button
          onClick={() => revoke(r.sessionId)}
          className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg"
        >
          بستن
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">جلسات فعال</h2>
        <p className="text-sm text-gray-500">مدیریت نشست‌های معتبر</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <AdminTable columns={columns} rows={sessions.map((s) => ({ ...s, id: s._id }))} loading={loading} />
      </div>
    </div>
  );
}
