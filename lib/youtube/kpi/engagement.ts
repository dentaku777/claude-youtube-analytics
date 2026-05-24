import { calcSpreadRate } from "./spread-rate";

/**
 * 動画のエンゲージメント拡張 KPI を計算する。
 * 要件 §3.2 #7-9, F-INSIGHT-15
 *
 *   高評価率   = likeCount / viewCount * 100
 *   コメント率 = commentCount / viewCount * 100
 *   バイラル係数 = 伸び率 * 高評価率 / 100
 */
export interface EngagementMetrics {
  likeRate: number | null; // %
  commentRate: number | null; // %
  viralScore: number | null;
}

export function calcEngagement(input: {
  viewCount: number;
  likeCount: number | null;
  commentCount: number | null;
  subscriberCount: number | null;
}): EngagementMetrics {
  const { viewCount, likeCount, commentCount, subscriberCount } = input;

  const likeRate = computeRate(likeCount, viewCount);
  const commentRate = computeRate(commentCount, viewCount);

  const spread = calcSpreadRate(viewCount, subscriberCount);
  const viralScore =
    spread !== null && likeRate !== null
      ? round2((spread * likeRate) / 100)
      : null;

  return { likeRate, commentRate, viralScore };
}

function computeRate(numerator: number | null, denominator: number): number | null {
  if (numerator === null) return null;
  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  return round2((numerator / denominator) * 100);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
