/**
 * Next.js instrumentation entry (Sentry の自動初期化用)
 * https://nextjs.org/docs/app/guides/instrumentation
 *
 * SENTRY_DSN が未設定なら init は no-op。
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
