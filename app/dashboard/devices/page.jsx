"use client";

import { useEffect, useState } from "react";

export default function Devices() {

  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetch("/api/auth/sessions")
      .then(res => res.json())
      .then(data => setSessions(data.data));
  }, []);

  async function logoutDevice(id) {
    await fetch(`/api/auth/sessions/${id}`, {
      method: "DELETE"
    });

    setSessions(prev => prev.filter(s => s._id !== id));
  }

  return (
    <div className="space-y-8">

      <h1 className="text-3xl font-bold">
        دستگاه‌های فعال
      </h1>

      {sessions?.map(session => (
        <div
          key={session._id}
          className="bg-white p-6 rounded-2xl shadow flex justify-between items-center"
        >
          <div>
            <p className="font-semibold text-lg">
              {session.userAgent}
            </p>
            <p className="text-sm text-gray-500">
              IP: {session.ip}
            </p>

            {session.isCurrent && (
              <span className="text-green-600 text-xs">
                این دستگاه فعلی شماست
              </span>
            )}
          </div>

          {!session.isCurrent && (
            <button
              onClick={() => logoutDevice(session._id)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              خروج از دستگاه
            </button>
          )}
        </div>
      ))}

    </div>
  );
}
