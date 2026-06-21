import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

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

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET);
    return decoded;
  } catch (error) {
    console.error("JWT Verify Error:", error.message);
    return null;
  }
}

export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}