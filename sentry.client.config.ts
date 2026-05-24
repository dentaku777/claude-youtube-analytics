import * as Sentry from "@sentry/nextjs";

// ブラウザ側 Sentry 初期化。DSN は Vercel env で設定。
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    enabled: process.env.NODE_ENV === "production",
  });
}
