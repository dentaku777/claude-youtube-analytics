import type { VideoEntry } from "../types";

/**
 * 月別投稿頻度と月別総再生数を集計する (要件 §3.4)。
 *
 * 戻り値は新しい月が末尾になる順 (古→新)。
 * 過去 12 ヶ月分を埋める (該当月に動画がなくても 0 で穴埋め)。
 */
export interface MonthlyTrendPoint {
  yearMonth: string; // "YYYY-MM"
  postCount: number;
  totalViews: number;
}

export function buildMonthlyTrend(
  videos: VideoEntry[],
  monthsBack = 12,
  now: Date = new Date(),
): MonthlyTrendPoint[] {
  // 月キーをYYYY-MM形式で生成
  const months: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${yyyy}-${mm}`);
  }

  // 集計バケット初期化
  const buckets = new Map<string, { count: number; views: number }>(
    months.map((m) => [m, { count: 0, views: 0 }]),
  );

  // 動画を月キーで集約
  for (const v of videos) {
    const d = v.publishedAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count++;
      bucket.views += v.viewCount;
    }
  }

  return months.map((m) => {
    const b = buckets.get(m)!;
    return { yearMonth: m, postCount: b.count, totalViews: b.views };
  });
}
