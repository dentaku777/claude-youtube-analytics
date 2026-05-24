import * as Sentry from "@sentry/nextjs";

// サーバー側 Sentry 初期化。DSN は Vercel env で設定。
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.VERCEL_ENV ?? "development",
    enabled: process.env.NODE_ENV === "production",
  });
}
