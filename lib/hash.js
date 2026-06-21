import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 12;

export async function hashValue(value) {
  if (!value) {
    throw new Error("Cannot hash empty value");
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return await bcrypt.hash(value, salt);
}

export async function compareValue(plainText, hashedValue) {
  if (!plainText || !hashedValue) {
    return false;
  }
  return await bcrypt.compare(plainText, hashedValue);
}

export function generateSecureCode(length = 6, type = "number") {
  let code = "";
  if (type === "number") {
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
  } else if (type === "hex") {
    const bytes = Math.ceil(length / 2);
    const randomBytes = crypto.randomBytes(bytes);
    code = randomBytes.toString("hex").toUpperCase().slice(0, length);
  } else {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let i = 0; i < length; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return code;
}

export function generateSessionId() {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateDeviceId() {
  return crypto.randomBytes(32).toString("hex");
}