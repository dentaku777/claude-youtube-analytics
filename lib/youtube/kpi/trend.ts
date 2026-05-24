import type { VideoEntry } from "../types";

/**
 * 推移グラフのバケット粒度。
 * - "day"   : YYYY-MM-DD (1w / 1m など短期間)
 * - "month" : YYYY-MM    (3m 以上 / all)
 */
export type TrendGranularity = "day" | "month";

export interface TrendPoint {
  /** "YYYY-MM-DD" (granularity=day) または "YYYY-MM" (granularity=month) */
  bucket: string;
  postCount: number;
  totalViews: number;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// バケット境界は UTC で統一する。
// 本番 (Vercel) は UTC、ローカル (JST) はズレるため UTC 固定で挙動を一致させる。
function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

function dayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * 動画群を指定粒度・バケット数で集計する (要件 §3.4)。
 * 戻り値は古→新の順 (末尾が最新バケット)。
 * 動画がないバケットも 0 で穴埋め。
 */
export function buildTrend(
  videos: VideoEntry[],
  granularity: TrendGranularity,
  bucketsBack: number,
  now: Date = new Date(),
): TrendPoint[] {
  const buckets: string[] = [];
  for (let i = bucketsBack - 1; i >= 0; i--) {
    if (granularity === "month") {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
      );
      buckets.push(monthKey(d));
    } else {
      const d = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - i,
        ),
      );
      buckets.push(dayKey(d));
    }
  }

  const map = new Map<string, { count: number; views: number }>(
    buckets.map((b) => [b, { count: 0, views: 0 }]),
  );

  for (const v of videos) {
    const key =
      granularity === "month" ? monthKey(v.publishedAt) : dayKey(v.publishedAt);
    const bucket = map.get(key);
    if (bucket) {
      bucket.count++;
      bucket.views += v.viewCount;
    }
  }

  return buckets.map((b) => {
    const x = map.get(b)!;
    return { bucket: b, postCount: x.count, totalViews: x.views };
  });
}
