// src/lib/db.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("❌ MONGODB_URI no definida en .env.local");

type GlobalWithMongoose = typeof globalThis & {
  _mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const g = global as GlobalWithMongoose;

if (!g._mongoose) {
  g._mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (g._mongoose!.conn) return g._mongoose!.conn;

  if (!g._mongoose!.promise) {
    g._mongoose!.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "notivium",
        autoIndex: true,
        bufferCommands: false,
        maxPoolSize: 10,
      })
      .then((m) => {
        console.log("✅ Connected to MongoDB (notivium)");
        return m;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err?.message || err);
        throw err;
      });
  }
  g._mongoose!.conn = await g._mongoose!.promise;
  return g._mongoose!.conn;
}
