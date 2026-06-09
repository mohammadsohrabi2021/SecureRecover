import mongoose from "mongoose"

/*
  اتصال به دیتابیس MongoDB
  از caching استفاده شده تا در حالت development
  اتصال‌های تکراری ایجاد نشود
*/

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("آدرس دیتابیس در فایل .env.local تعریف نشده است")
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null
  }
}

export default async function connectDB() {

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {

    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "secure-recover"
    })

  }

  cached.conn = await cached.promise

  return cached.conn
}
