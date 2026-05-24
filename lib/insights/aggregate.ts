import type { VideoWithKpi } from "@/lib/youtube/kpi/video";
import { enrichVideosWithKpi } from "@/lib/youtube/kpi/video";
import {
  getAnalysisCache,
  type CachePeriod,
} from "@/lib/cache/analysis-cache";

export interface AggregatedVideo extends VideoWithKpi {
  channelId: string;
  channelTitle: string;
}

/**
 * 選択されたチャンネル ID 群について AnalysisCache から動画一覧を統合する。
 * キャッシュがないチャンネルはスキップ (Watchlist の「全件再分析」誘導)。
 */
export async function aggregateInsightsData(
  channelInputs: Array<{ channelId: string; channelTitle: string }>,
  period: CachePeriod = "3m",
  hitThreshold = 100,
): Promise<{
  videos: AggregatedVideo[];
  missingChannels: Array<{ channelId: string; channelTitle: string }>;
}> {
  const missing: Array<{ channelId: string; channelTitle: string }> = [];
  const all: AggregatedVideo[] = [];

  for (const ch of channelInputs) {
    const cache = await getAnalysisCache(ch.channelId, period);
    if (!cache) {
      missing.push(ch);
      continue;
    }
    const enriched = enrichVideosWithKpi(
      cache.videos,
      cache.meta.subscriberCount,
      hitThreshold,
    );
    for (const v of enriched) {
      all.push({
        ...v,
        channelId: ch.channelId,
        channelTitle: ch.channelTitle,
      });
    }
  }

  return { videos: all, missingChannels: missing };
}
