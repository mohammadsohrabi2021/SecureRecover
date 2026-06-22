"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminTable from "@/components/admin/AdminTable";

const TRUST_COLORS = {
  HIGH: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-red-100 text-red-700",
  CRITICAL: "bg-red-200 text-red-800",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchUsers(q = search) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok) setUsers(data.data.users || []);
      else toast.error(data.message);
    } catch {
      toast.error("خطا در دریافت کاربران");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function toggleStatus(userId, current) {
    if (!confirm(`آیا از ${current ? "غیرفعال" : "فعال"} کردن مطمئن هستید؟`)) return;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message);
      fetchUsers();
    } else toast.error(data.message);
  }

  const columns = [
    { key: "name", label: "نام", render: (r) => r.name },
    { key: "email", label: "ایمیل", render: (r) => r.email },
    { key: "phone", label: "تلفن", render: (r) => r.phone },
    {
      key: "trust",
      label: "اعتماد",
      render: (r) => (
        <span className={`px-2 py-0.5 rounded-full text-xs ${TRUST_COLORS[r.trustLevel] || TRUST_COLORS.MEDIUM}`}>
          {r.trustScore} — {r.trustLevel}
        </span>
      ),
    },
    {
      key: "status",
      label: "وضعیت",
      render: (r) => (
        <span className={r.isActive ? "text-green-600" : "text-red-600"}>
          {r.isActive ? "فعال" : "غیرفعال"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "عملیات",
      render: (r) => (
        <button
          onClick={() => toggleStatus(r._id, r.isActive)}
          className={`text-xs px-3 py-1 rounded-lg ${
            r.isActive ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
          }`}
        >
          {r.isActive ? "غیرفعال" : "فعال"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">مدیریت کاربران</h2>
          <p className="text-sm text-gray-500">{users.length} کاربر</p>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو..."
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-56"
          />
          <button
            onClick={() => fetchUsers()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm shrink-0"
          >
            جستجو
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <AdminTable
          columns={columns}
          rows={users.map((u) => ({ ...u, id: u._id }))}
          loading={loading}
        />
      </div>
    </div>
  );
}
