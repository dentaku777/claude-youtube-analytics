import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 設定 (E2E スカフォールド)
 *
 * 起動:
 *   1. 別ターミナルで `npm run dev` を実行 (3000 番ポート)
 *   2. `npm run test:e2e` でテスト実行
 *
 * 注意: 実 DB と実 YouTube API が必要なフローはタグで分離するなど追加整備が必要。
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
