import { test, expect } from "@playwright/test";

/**
 * 公開ページの基本スモークテスト (認証不要のページのみ)。
 * 認証フローを伴う E2E は今後の追加対象 (テストユーザー seed が必要)。
 */

test.describe("Public pages smoke", () => {
  test("ランディングが 200 で表示される", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(400);
  });

  test("ログインページにフォームが描画される", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /ログイン/ })).toBeVisible();
  });

  test("サインアップページにフォームが描画される", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("button", { name: /登録|サインアップ/ })).toBeVisible();
  });

  test("認証必須パスは /login にリダイレクト", async ({ page }) => {
    const res = await page.goto("/search");
    expect(res?.url()).toMatch(/\/login/);
  });
});
