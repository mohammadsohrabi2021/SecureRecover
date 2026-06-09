"use client";

import { useEffect, useState } from "react";

export default function Activity() {

  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("/api/auth/security-logs")
      .then(res => res.json())
      .then(data => setLogs(data.data));
  }, []);

  return (
    <div className="space-y-8">

      <h1 className="text-3xl font-bold">
        گزارش فعالیت‌های امنیتی
      </h1>

      {logs.map(log => (
        <div
          key={log._id}
          className="bg-white p-6 rounded-2xl shadow"
        >
          <p className="font-semibold text-lg">
            {log.event}
          </p>

          <p className="text-sm text-gray-500">
            {new Date(log.createdAt).toLocaleString("fa-IR")}
          </p>

          <p className="text-xs text-gray-400">
            IP: {log.ip}
          </p>
        </div>
      ))}

    </div>
  );
}
