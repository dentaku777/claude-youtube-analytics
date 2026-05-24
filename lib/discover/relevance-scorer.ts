import type { RelatedChannelHit } from "./related-finder";

/**
 * 関連度スコアリング (F-DISCOVER-04)
 *
 * スコア = 0.5 * キーワード一致率 + 0.3 * 規模類似度 + 0.2 * 伸び率類似度
 * 0..1 で正規化
 */

export interface ScoringInput {
  hit: RelatedChannelHit;
  subscriberCount: number | null;
  avgSpreadRate: number | null;
  thumbnailUrl?: string;
}

export interface SeedStats {
  subscriberCount: number | null;
  avgSpreadRate: number | null;
  totalKeywords: number;
}

export interface ScoredCandidate {
  channelId: string;
  channelTitle: string;
  hitKeywords: string[];
  matchCount: number;
  subscriberCount: number | null;
  avgSpreadRate: number | null;
  thumbnailUrl?: string;
  score: number; // 0..1
  scoreBreakdown: {
    keywordMatch: number;
    sizeSimilarity: number;
    spreadSimilarity: number;
  };
}

export function scoreCandidate(
  c: ScoringInput,
  seed: SeedStats,
): ScoredCandidate {
  const keywordMatch =
    seed.totalKeywords > 0
      ? Math.min(1, c.hit.matchCount / seed.totalKeywords)
      : 0;

  const sizeSimilarity = similarityFromRatio(
    seed.subscriberCount,
    c.subscriberCount,
  );

  const spreadSimilarity = similarityFromAbsoluteDiff(
    seed.avgSpreadRate,
    c.avgSpreadRate,
    100, // 100% 差で完全不一致
  );

  const score =
    0.5 * keywordMatch + 0.3 * sizeSimilarity + 0.2 * spreadSimilarity;

  return {
    channelId: c.hit.channelId,
    channelTitle: c.hit.channelTitle,
    hitKeywords: c.hit.hitKeywords,
    matchCount: c.hit.matchCount,
    subscriberCount: c.subscriberCount,
    avgSpreadRate: c.avgSpreadRate,
    thumbnailUrl: c.thumbnailUrl,
    score: Math.round(score * 1000) / 1000,
    scoreBreakdown: {
      keywordMatch: Math.round(keywordMatch * 1000) / 1000,
      sizeSimilarity: Math.round(sizeSimilarity * 1000) / 1000,
      spreadSimilarity: Math.round(spreadSimilarity * 1000) / 1000,
    },
  };
}

function similarityFromRatio(
  a: number | null,
  b: number | null,
): number {
  if (a === null || b === null || a === 0 || b === 0) return 0;
  const ratio = a >= b ? b / a : a / b; // 0..1
  return ratio;
}

function similarityFromAbsoluteDiff(
  a: number | null,
  b: number | null,
  maxDiff: number,
): number {
  if (a === null || b === null) return 0;
  const diff = Math.abs(a - b);
  return Math.max(0, 1 - diff / maxDiff);
}
