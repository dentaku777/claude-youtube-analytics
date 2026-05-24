import * as Sentry from "@sentry/nextjs";

// Edge ランタイム (middleware 等) 用 Sentry 初期化。
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.VERCEL_ENV ?? "development",
    enabled: process.env.NODE_ENV === "production",
  });
}
