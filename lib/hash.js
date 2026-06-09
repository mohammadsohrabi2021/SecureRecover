// lib/hash.js
import crypto from "crypto";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

// برای هش کردن داده‌های حساس (مثل کدها)
export async function hashValue(value) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return await bcrypt.hash(value, salt);
}

// مقایسه مقدار اصلی با هش
export async function compareValue(plainText, hashedValue) {
  return await bcrypt.compare(plainText, hashedValue);
}

// تولید کد امن تصادفی
export function generateSecureCode(length = 8, type = "hex") {
  const bytes = Math.ceil(length / 2);
  const randomBytes = crypto.randomBytes(bytes);
  
  if (type === "hex") {
    return randomBytes.toString("hex").toUpperCase().slice(0, length);
  } else if (type === "number") {
    // برای OTP عددی 6 رقمی
    const code = parseInt(randomBytes.toString("hex"), 16) % 1000000;
    return code.toString().padStart(6, "0");
  }
  
  return randomBytes.toString("base64").slice(0, length);
}

// تولید sessionId یکتا
export function generateSessionId() {
  return crypto.randomBytes(32).toString("base64url");
}

// تولید deviceId یکتا
export function generateDeviceId() {
  return crypto.randomBytes(32).toString("hex");
}