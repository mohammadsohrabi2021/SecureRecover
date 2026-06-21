export async function getGeoLocation(ip) {
    if (ip === "127.0.0.1" || ip === "localhost" || ip === "::1") {
      return {
        lat: 35.6892,
        lng: 51.3890,
        city: "Tehran",
        country: "IR",
        region: "Tehran"
      };
    }
  
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await response.json();
  
      if (data.status === "success") {
        return {
          lat: data.lat,
          lng: data.lon,
          city: data.city,
          country: data.countryCode,
          region: data.regionName
        };
      }
    } catch (error) {
      console.error("Geo location error:", error);
    }
  
    return null;
  }
  
  export async function isSuspiciousIP(ip) {
    // می‌توانید از API های امنیتی مانند AbuseIPDB استفاده کنید
    // برای فعلاً false برگردانید
    return false;
  }
  
  export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }