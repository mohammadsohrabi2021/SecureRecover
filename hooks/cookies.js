// lib/cookies.js
export function createAuthCookie(token) {
    const isProduction = process.env.NODE_ENV === "production";
    
    return `secure_recover_session=${token}; Path=/; HttpOnly; SameSite=Strict; ${isProduction ? "Secure; " : ""}Max-Age=604800`;
  }
  
  export function clearAuthCookie() {
    return `secure_recover_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
  }