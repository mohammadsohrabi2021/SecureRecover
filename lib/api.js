// lib/api.js - مطمئن شوید این فایل درست کار می‌کند
export async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || "خطا در ارتباط با سرور");
  }
  
  return data;
}