import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredCaches } from "@/lib/cache/analysis-cache";

/**
 * Vercel Cron で日次実行する期限切れキャッシュ一掃ジョブ。
 *
 * vercel.json の crons セクションで schedule 登録。
 * セキュリティ: Vercel は header `Authorization: Bearer $CRON_SECRET` を付与するので
 * production では CRON_SECRET 環境変数で照合する。
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const expected = process.env.CRON_SECRET;
    const got = req.headers.get("authorization");
    if (!expected || got !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const deleted = await cleanupExpiredCaches();
  return NextResponse.json({
    ok: true,
    deleted,
    at: new Date().toISOString(),
  });
}
