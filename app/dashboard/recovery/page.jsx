"use client";

import { useEffect, useState } from "react";

export default function Recovery() {

  const [codes, setCodes] = useState([]);

  useEffect(() => {
    fetch("/api/auth/recovery-codes")
      .then(res => res.json())
      .then(data => setCodes(data.data));
  }, []);

  async function regenerate() {

    const res = await fetch("/api/auth/recovery-codes/regenerate", {
      method: "POST"
    });

    const data = await res.json();
    setCodes(data.data);
  }

  return (
    <div className="space-y-8">

      <h1 className="text-3xl font-bold">
        کدهای بازیابی حساب
      </h1>

      <p className="text-gray-500">
        این کدها را در جای امن نگه دارید. هر کد فقط یک بار قابل استفاده است.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {codes.map((code, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-xl shadow text-center font-mono"
          >
            {code}
          </div>
        ))}
      </div>

      <button
        onClick={regenerate}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
      >
        تولید مجدد کدها
      </button>

    </div>
  );
}
