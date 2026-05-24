import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// @neondatabase/serverless の Pool は WebSocket 経由で接続するため
// Node ランタイムでは ws パッケージを注入する必要がある。
// Node 24 の native WebSocket は @neondatabase/serverless と互換性に問題があるため
// 常に ws polyfill を使う
neonConfig.webSocketConstructor = ws;

declare global {
  // dev のホットリロード時に PrismaClient が複数生成されるのを防ぐ
  var prismaClient: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment variables");
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.prismaClient ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaClient = prisma;
}
