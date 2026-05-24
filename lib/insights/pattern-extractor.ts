import type { AggregatedVideo } from "./aggregate";

/**
 * 勝ち動画パターン抽出 (F-INSIGHT-10)
 * 伸び率 ≥ hitThreshold (=100%) の動画群を選び、共通点を集計する。
 */

export interface HitPatternStats {
  hits: AggregatedVideo[];
  hitCount: number;
  totalCount: number;
  // 尺帯別ヒット率
  durationBuckets: Array<{ label: string; min: number; max: number; hits: number; all: number }>;
  // Shorts vs 通常
  shortsHits: number;
  shortsTotal: number;
  regularHits: number;
  regularTotal: number;
  // 投稿曜日別ヒット率 (0=日 .. 6=土)
  dayOfWeek: Array<{ day: number; label: string; hits: number; all: number }>;
}

const DURATION_BUCKETS: Array<{ label: string; min: number; max: number }> = [
  { label: "≤60s (Shorts)", min: 0, max: 60 },
  { label: "1–5 分", min: 61, max: 300 },
  { label: "5–10 分", min: 301, max: 600 },
  { label: "10–20 分", min: 601, max: 1200 },
  { label: "20 分超", min: 1201, max: Infinity },
];

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function extractHitPatterns(
  videos: AggregatedVideo[],
  hitThreshold = 100,
): HitPatternStats {
  const hits = videos.filter(
    (v) => v.spreadRate !== null && v.spreadRate >= hitThreshold,
  );

  const durationBuckets = DURATION_BUCKETS.map((b) => ({
    ...b,
    hits: hits.filter((v) => v.durationSec >= b.min && v.durationSec <= b.max).length,
    all: videos.filter((v) => v.durationSec >= b.min && v.durationSec <= b.max).length,
  }));

  const shortsHits = hits.filter((v) => v.isShort).length;
  const shortsTotal = videos.filter((v) => v.isShort).length;
  const regularHits = hits.length - shortsHits;
  const regularTotal = videos.length - shortsTotal;

  const dayOfWeek = DAY_LABELS.map((label, day) => ({
    day,
    label,
    hits: hits.filter((v) => v.publishedAt.getDay() === day).length,
    all: videos.filter((v) => v.publishedAt.getDay() === day).length,
  }));

  return {
    hits,
    hitCount: hits.length,
    totalCount: videos.length,
    durationBuckets,
    shortsHits,
    shortsTotal,
    regularHits,
    regularTotal,
    dayOfWeek,
  };
}
