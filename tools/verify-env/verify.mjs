import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../.env.local");

const result = config({ path: envPath });
if (result.error) {
  console.error("[FAIL] .env.local の読み込み失敗:", result.error.message);
  process.exit(1);
}
console.log("[OK] .env.local 読み込み:", envPath);

const required = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "ENCRYPTION_KEY",
  "RESEND_API_KEY",
  "TEST_YOUTUBE_API_KEY",
];

const missing = required.filter((k) => !process.env[k]);
const lengthChecks = [
  { key: "NEXTAUTH_SECRET", min: 32 },
  { key: "ENCRYPTION_KEY", min: 32 },
];

if (missing.length) {
  console.error("[FAIL] 未設定の環境変数:", missing.join(", "));
  process.exit(1);
}
console.log(`[OK] 必須環境変数 ${required.length} 件すべて設定済み`);

for (const { key, min } of lengthChecks) {
  const v = process.env[key];
  if (v.length < min) {
    console.warn(`[WARN] ${key} の長さが短い (${v.length} 文字, 推奨 ${min}+)`);
  }
}

let failed = 0;

console.log("\n--- Test 1: Neon DB 接続 ---");
try {
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT version() as version, current_database() as db, now() as ts`;
  const row = rows[0];
  console.log("[OK] 接続成功");
  console.log("  PostgreSQL:", row.version.split(",")[0]);
  console.log("  Database  :", row.db);
  console.log("  Server時刻:", row.ts);
} catch (e) {
  console.error("[FAIL] Neon DB 接続失敗:", e.message);
  failed++;
}

console.log("\n--- Test 2: YouTube Data API ---");
try {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=@youtube&key=${encodeURIComponent(
    process.env.TEST_YOUTUBE_API_KEY,
  )}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error(`[FAIL] HTTP ${res.status} ${res.statusText}`);
    console.error("  Body:", body.slice(0, 300));
    failed++;
  } else {
    const data = await res.json();
    if (data.items?.length) {
      const ch = data.items[0];
      console.log("[OK] API キー有効");
      console.log("  Channel  :", ch.snippet.title);
      console.log("  Subscribers:", ch.statistics?.subscriberCount ?? "(hidden)");
      console.log("  Quota使用 : 約 1〜3 ユニット");
    } else {
      console.error("[FAIL] 想定外のレスポンス:", JSON.stringify(data).slice(0, 200));
      failed++;
    }
  }
} catch (e) {
  console.error("[FAIL] YouTube API リクエスト失敗:", e.message);
  failed++;
}

console.log("\n========================================");
if (failed === 0) {
  console.log("[ALL OK] Phase 0 接続確認完了 - Phase 1 着手可能");
  process.exit(0);
} else {
  console.log(`[FAILED] ${failed} 件の確認失敗 - Phase 1 着手前に修正が必要`);
  process.exit(1);
}
