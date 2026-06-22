"use client";

import { useCallback } from "react";

function generateDeviceId() {
  try {
    const ua = navigator.userAgent || "";
    const lang = navigator.language || "en-US";
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const screen = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
    const raw = `${ua}|${lang}|${tz}|${screen}`;

    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash &= hash;
    }

    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    const ts = Date.now().toString(36).slice(-6);
    return `${hex}_${ts}`;
  } catch {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function useDeviceId() {
  const getDeviceId = useCallback(async (identifier) => {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem("deviceId");
    if (stored) return stored;

    try {
      const res = await fetch("/api/auth/check-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (res.ok && data.deviceId) {
        localStorage.setItem("deviceId", data.deviceId);
        return data.deviceId;
      }
    } catch {
      /* fallback below */
    }

    const deviceId = generateDeviceId();
    localStorage.setItem("deviceId", deviceId);
    return deviceId;
  }, []);

  return { getDeviceId };
}
