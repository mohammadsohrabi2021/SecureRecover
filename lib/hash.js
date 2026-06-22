import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 12;

export async function hashValue(value) {
  if (!value) {
    throw new Error("Cannot hash empty value");
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(String(value), salt);
}

export async function compareValue(plainText, hashedValue) {
  if (!plainText || !hashedValue) {
    return false;
  }
  return bcrypt.compare(String(plainText), hashedValue);
}

export function generateSecureCode(length = 6, type = "number") {
  if (type === "number") {
    let code = "";
    for (let i = 0; i < length; i++) {
      code += crypto.randomInt(0, 10).toString();
    }
    return code;
  }

  if (type === "hex") {
    const bytes = Math.ceil(length / 2);
    return crypto.randomBytes(bytes).toString("hex").toUpperCase().slice(0, length);
  }

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return code;
}

export function generateSessionId() {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateDeviceId() {
  return crypto.randomBytes(32).toString("hex");
}
