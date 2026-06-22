import { getGeoLocation, isSuspiciousIP } from "@/lib/utils/geo";

export function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export function getUserAgent(req) {
  return req.headers.get("user-agent") || "unknown";
}

export async function getRequestMeta(req, deviceId = null) {
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);
  const [location, isSuspiciousIPFlag] = await Promise.all([
    getGeoLocation(ip),
    isSuspiciousIP(ip),
  ]);

  return {
    ip,
    userAgent,
    deviceId,
    location,
    isSuspiciousIP: isSuspiciousIPFlag,
  };
}
