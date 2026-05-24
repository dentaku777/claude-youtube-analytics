import type { VideoEntry } from "../types";
import { calcSpreadRate, classifySpread, type SpreadCategory } from "./spread-rate";
import { calcEngagement, type EngagementMetrics } from "./engagement";

/**
 * 動画レベルの 9 つの KPI を VideoEntry に追加した拡張型。
 * 要件 §3.2 (6 基本 + 3 拡張)
 */
export interface VideoWithKpi extends VideoEntry {
  spreadRate: number | null; // 伸び率 (%)
  spreadCategory: SpreadCategory; // win / healthy / low / unknown
  engagement: EngagementMetrics;
}

/**
 * VideoEntry に KPI 計算結果を付与する。
 * subscriberCount はチャンネル全体の登録者数 (動画個別ではない)。
 */
export function enrichVideoWithKpi(
  video: VideoEntry,
  subscriberCount: number | null,
  hitThreshold = 100,
): VideoWithKpi {
  const spreadRate = calcSpreadRate(video.viewCount, subscriberCount);
  return {
    ...video,
    spreadRate,
    spreadCategory: classifySpread(spreadRate, hitThreshold),
    engagement: calcEngagement({
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      commentCount: video.commentCount,
      subscriberCount,
    }),
  };
}

export function enrichVideosWithKpi(
  videos: VideoEntry[],
  subscriberCount: number | null,
  hitThreshold = 100,
): VideoWithKpi[] {
  return videos.map((v) => enrichVideoWithKpi(v, subscriberCount, hitThreshold));
}
