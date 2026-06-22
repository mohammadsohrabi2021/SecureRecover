"use client";

import { useEffect, useState } from "react";
import AdminTable from "@/components/admin/AdminTable";

const LEVEL_COLORS = {
  HIGH: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-red-100 text-red-700",
  CRITICAL: "bg-red-200 text-red-800",
};

export default function AdminTrustPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    let url = "/api/admin/trust";
    if (filter === "low") url += "?maxScore=29";
    if (filter === "critical") url += "?maxScore=-1";

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRecords(d.data.records || []);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  const columns = [
    { key: "user", label: "کاربر", render: (r) => r.userId?.name || "—" },
    { key: "email", label: "ایمیل", render: (r) => r.userId?.email || "—" },
    {
      key: "score",
      label: "امتیاز",
      render: (r) => (
        <span className="font-bold">{r.currentScore}</span>
      ),
    },
    {
      key: "level",
      label: "سطح",
      render: (r) => (
        <span className={`px-2 py-0.5 rounded-full text-xs ${LEVEL_COLORS[r.level]}`}>
          {r.level}
        </span>
      ),
    },
    {
      key: "devices",
      label: "دستگاه‌ها",
      render: (r) => r.trustedDevices?.length || 0,
    },
    {
      key: "unusual",
      label: "مشکوک",
      render: (r) => (
        <span className={r.unusualCount > 0 ? "text-red-600 font-medium" : "text-gray-400"}>
          {r.unusualCount}
        </span>
      ),
    },
    {
      key: "updated",
      label: "بروزرسانی",
      render: (r) =>
        r.lastUpdated ? new Date(r.lastUpdated).toLocaleDateString("fa-IR") : "—",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">امتیاز اعتماد</h2>
          <p className="text-sm text-gray-500">پایش Dynamic Trust Scoring</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="all">همه</option>
          <option value="low">اعتماد پایین (&lt;30)</option>
          <option value="critical">بحرانی (&lt;0)</option>
        </select>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <AdminTable columns={columns} rows={records.map((r) => ({ ...r, id: r._id }))} loading={loading} />
      </div>
    </div>
  );
}
