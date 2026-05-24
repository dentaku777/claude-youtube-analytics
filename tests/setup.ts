import { config } from "dotenv";
import { randomBytes } from "node:crypto";

// .env.local を読み込み (Next.js と同じ挙動)
config({ path: ".env.local" });

// 単体テスト用のフォールバック: ENCRYPTION_KEY が未設定なら一時値を注入
// (.env.local が無い CI 環境などでも crypto テストが動くように)
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");
}
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}
