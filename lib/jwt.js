// lib/jwt.js
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET در فایل env تعریف نشده");
}

// تولید توکن با sessionId
export function signToken(userId, sessionId) {
  return jwt.sign(
    { 
      userId, 
      sessionId,
      iat: Math.floor(Date.now() / 1000)
    }, 
    SECRET, 
    {
      expiresIn: "7d"
    }
  );
}

// verify توکن و return payload
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET);
    
    // بررسی انقضا (jwt این کار رو خودش میکنه ولی برای اطمینان)
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error("JWT Verify Error:", error.message);
    return null;
  }
}

// decode بدون verify (فقط برای خواندن payload)
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}