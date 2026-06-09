// lib/rate-limit.js
// این یک پیاده‌سازی ساده در memory است. برای production از Redis استفاده کنید

const rateLimitStore = new Map();

export async function rateLimit(key, action, maxRequests, windowSeconds) {
  const storeKey = `${key}:${action}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  
  if (!rateLimitStore.has(storeKey)) {
    rateLimitStore.set(storeKey, []);
  }
  
  const requests = rateLimitStore.get(storeKey).filter(timestamp => timestamp > windowStart);
  
  if (requests.length >= maxRequests) {
    return { success: false, remaining: 0, resetAfter: windowSeconds };
  }
  
  requests.push(now);
  rateLimitStore.set(storeKey, requests);
  
  // پاکسازی خودکار (اختیاری)
  setTimeout(() => {
    const current = rateLimitStore.get(storeKey) || [];
    rateLimitStore.set(storeKey, current.filter(t => t > Date.now() - windowSeconds * 1000));
  }, windowSeconds * 1000);
  
  return { 
    success: true, 
    remaining: maxRequests - requests.length,
    resetAfter: windowSeconds - ((now - (requests[0] || now)) / 1000)
  };
}