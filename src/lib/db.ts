// Cached Mongoose connection for Next.js.
// Reason: Next.js dev server hot-reloads modules, which would otherwise spawn
// a fresh connection (and a leaked socket) on every change. We park the
// promise on globalThis so the same connection is reused across reloads.

import "server-only";
import mongoose, { type Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI. Add it to .env.local before starting the server.",
  );
}

type MongoCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __mongoCache: MongoCache | undefined;
}

const cache: MongoCache =
  globalThis.__mongoCache ?? (globalThis.__mongoCache = { conn: null, promise: null });

export async function connectDB(): Promise<Mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI as string, {
        bufferCommands: false,
        // We keep options minimal — Atlas defaults are sane for a CRM workload.
      })
      .then((m) => m);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
