import type { ChannelMeta } from "../types";
import type { VideoWithKpi } from "./video";

/**
 * チャンネルレベルの 8 つの KPI。
 * 要件 §3.1
 */
export interface ChannelKpi {
  // 1-4: API 由来 (そのまま)
  title: string;
  subscriberCount: number | null; // 非公開なら null
  videoCount: number;
  viewCount: number;
  // 5-7: 計算系
  avgViewsPerVideo: number | null; // 総再生数 ÷ 動画本数
  avgSpreadRate: number | null; // 期間内動画の伸び率の平均
  postingFrequencyPerDay: number | null; // 期間内動画数 ÷ 期間日数
  // 8: API 由来
  channelCreatedAt: Date;
  // 補助情報
  periodDays: number | null;
  videosInPeriod: number;
  hitsInPeriod: number; // 伸び率 ≥ hitThreshold の本数
}

/**
 * @param videosWithKpi 期間内のみに絞られた動画群 (fetcher で絞り込み済)
 * @param periodDays 期間の日数 (1m=30, 3m=90, ...)。'all' の場合は null
 */
export function calcChannelKpi(
  meta: ChannelMeta,
  videosWithKpi: VideoWithKpi[],
  periodDays: number | null,
  hitThreshold = 100,
): ChannelKpi {
  const avgViewsPerVideo =
    meta.videoCount > 0
      ? Math.round(meta.viewCount / meta.videoCount)
      : null;

  const spreadValues = videosWithKpi
    .map((v) => v.spreadRate)
    .filter((s): s is number => s !== null);
  const avgSpreadRate =
    spreadValues.length > 0
      ? round2(spreadValues.reduce((a, b) => a + b, 0) / spreadValues.length)
      : null;

  const postingFrequencyPerDay =
    periodDays && periodDays > 0
      ? round2(videosWithKpi.length / periodDays)
      : null;

  const hitsInPeriod = videosWithKpi.filter(
    (v) => v.spreadRate !== null && v.spreadRate >= hitThreshold,
  ).length;

  return {
    title: meta.title,
    subscriberCount: meta.subscriberCount,
    videoCount: meta.videoCount,
    viewCount: meta.viewCount,
    avgViewsPerVideo,
    avgSpreadRate,
    postingFrequencyPerDay,
    channelCreatedAt: meta.publishedAt,
    periodDays,
    videosInPeriod: videosWithKpi.length,
    hitsInPeriod,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
