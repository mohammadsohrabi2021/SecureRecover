"use client";

import { useEffect, useState } from "react";
import AdminTable from "@/components/admin/AdminTable";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  function fetchLogs() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (actionFilter) params.set("action", actionFilter);

    fetch(`/api/admin/logs?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setLogs(d.data.logs || []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, actionFilter]);

  const columns = [
    {
      key: "time",
      label: "زمان",
      render: (r) => new Date(r.createdAt).toLocaleString("fa-IR"),
    },
    { key: "user", label: "کاربر", render: (r) => r.userId?.name || "—" },
    { key: "action", label: "رویداد", render: (r) => r.action },
    {
      key: "status",
      label: "وضعیت",
      render: (r) => (
        <span
          className={
            r.status === "success"
              ? "text-green-600"
              : r.status === "failed"
                ? "text-red-600"
                : "text-yellow-600"
          }
        >
          {r.status}
        </span>
      ),
    },
    { key: "ip", label: "IP", render: (r) => r.ip || "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">لاگ‌های امنیتی</h2>
          <p className="text-sm text-gray-500">فعالیت ورود و رویدادهای سیستم</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="success">موفق</option>
            <option value="failed">ناموفق</option>
            <option value="pending">در انتظار</option>
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">همه رویدادها</option>
            <option value="LOGIN_SUCCESS">ورود موفق</option>
            <option value="LOGIN_BLOCKED">مسدود</option>
            <option value="OTP_VERIFIED">OTP</option>
            <option value="ADMIN_APPROVAL_REQUESTED">تأیید ادمین</option>
          </select>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <AdminTable columns={columns} rows={logs.map((l) => ({ ...l, id: l._id }))} loading={loading} />
      </div>
    </div>
  );
}
