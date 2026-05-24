import type { YouTubeClient } from "@/lib/youtube/api/client";
import {
  fetchVideoDetails,
  fetchChannelMeta,
} from "@/lib/youtube/api/fetcher";
import { QUOTA_COST } from "@/lib/youtube/quota/cost";
import type { VideoEntry } from "@/lib/youtube/types";

/**
 * キーワード市場分析 (F-KEYWORD-03〜08)
 *
 * 1. search.list でキーワードに合致する動画 N 件取得 (100 ユニット)
 * 2. videos.list でメタ拡充 (50 件 / 1 ユニット)
 * 3. チャンネル毎集計 + 伸び率分布計算
 *
 * Quota: search 100 + videos ceil(N/50) + channels ceil(uniqCh/50)
 */

export interface MarketResearchInput {
  keyword: string;
  maxResults?: number; // 既定 50 (search.list の最大)
}

export interface KeywordVideoEntry extends VideoEntry {
  channelId: string;
  channelTitle: string;
  subscriberCount: number | null;
  spreadRate: number | null;
}

export interface KeywordChannelStats {
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  videoCount: number; // 当キーワードで取得できた本数
  totalViews: number;
  avgViews: number;
  avgSpreadRate: number | null;
}

export interface MarketResearchResult {
  keyword: string;
  totalVideos: number;
  totalViews: number;
  avgViews: number;
  channelCount: number;
  topChannels: KeywordChannelStats[]; // 動画数上位 10
  videos: KeywordVideoEntry[];
  // 伸び率分布 (ヒストグラム): <30, 30-99, 100-499, 500+, unknown
  histogram: Array<{ bucket: string; count: number }>;
  quotaSpent: number;
}

export async function researchKeywordMarket(
  client: YouTubeClient,
  input: MarketResearchInput,
): Promise<MarketResearchResult> {
  const maxResults = Math.min(input.maxResults ?? 50, 50);
  let quotaSpent = 0;

  // 1) search.list
  const searchRes = await client.get<{
    items?: Array<{ id?: { videoId?: string } }>;
  }>("search", {
    q: input.keyword,
    part: ["id"],
    type: "video",
    maxResults,
    order: "relevance",
  });
  quotaSpent += QUOTA_COST.SEARCH_LIST;

  const videoIds = (searchRes.items ?? [])
    .map((it) => it.id?.videoId)
    .filter((s): s is string => !!s);

  if (videoIds.length === 0) {
    return emptyResult(input.keyword, quotaSpent);
  }

  // 2) videos.list (50 件 1 ユニット)
  const { videos, quotaSpent: q2 } = await fetchVideoDetails(videoIds, client);
  quotaSpent += q2;

  // 3) チャンネル情報拡充 (登録者数取得が必要なため channels.list)
  //    snippet には channelId / channelTitle が入るが、現状 fetchVideoDetails では取得対象外。
  //    今回は videos.list の snippet を再利用するために再 fetch を 50 件単位で行う。
  const channelIdSet = new Set<string>();
  const videoChannelMap = new Map<string, { channelId: string; channelTitle: string }>();

  // videos.list の生レスを取得し直して channelId/channelTitle を引く
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const r = await client.get<{
      items?: Array<{
        id: string;
        snippet?: { channelId?: string; channelTitle?: string };
      }>;
    }>("videos", { part: ["snippet"], id: batch, maxResults: 50 });
    quotaSpent += QUOTA_COST.VIDEOS_LIST;
    for (const it of r.items ?? []) {
      const cid = it.snippet?.channelId;
      const ctitle = it.snippet?.channelTitle ?? "";
      if (cid) {
        channelIdSet.add(cid);
        videoChannelMap.set(it.id, { channelId: cid, channelTitle: ctitle });
      }
    }
  }

  // チャンネルメタを 50 件単位で取得
  const channelMetaMap = new Map<
    string,
    { subscriberCount: number | null; thumbnailUrl: string | null; title: string }
  >();
  const channelIds = Array.from(channelIdSet);
  for (let i = 0; i < channelIds.length; i += 50) {
    const batch = channelIds.slice(i, i + 50);
    if (batch.length === 0) break;
    const r = await client.get<{
      items?: Array<{
        id: string;
        snippet?: { title?: string; thumbnails?: { default?: { url?: string }; medium?: { url?: string } } };
        statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
      }>;
    }>("channels", {
      part: ["snippet", "statistics"],
      id: batch,
      maxResults: 50,
    });
    quotaSpent += QUOTA_COST.CHANNELS_LIST;
    for (const it of r.items ?? []) {
      const subStr = it.statistics?.subscriberCount;
      const hidden = it.statistics?.hiddenSubscriberCount;
      channelMetaMap.set(it.id, {
        subscriberCount: hidden ? null : subStr ? parseInt(subStr, 10) || 0 : 0,
        thumbnailUrl:
          it.snippet?.thumbnails?.medium?.url ??
          it.snippet?.thumbnails?.default?.url ??
          null,
        title: it.snippet?.title ?? "",
      });
    }
  }

  // 4) 各動画に channelId / spreadRate 付与
  const enriched: KeywordVideoEntry[] = videos.map((v) => {
    const vc = videoChannelMap.get(v.videoId);
    const cm = vc ? channelMetaMap.get(vc.channelId) : undefined;
    const subscriberCount = cm?.subscriberCount ?? null;
    const spreadRate =
      subscriberCount && subscriberCount > 0
        ? Math.round((v.viewCount / subscriberCount) * 10000) / 100
        : null;
    return {
      ...v,
      channelId: vc?.channelId ?? "",
      channelTitle: vc?.channelTitle ?? "",
      subscriberCount,
      spreadRate,
    };
  });

  // 5) チャンネル別集計
  const byChannel = new Map<string, KeywordVideoEntry[]>();
  for (const v of enriched) {
    if (!v.channelId) continue;
    const list = byChannel.get(v.channelId) ?? [];
    list.push(v);
    byChannel.set(v.channelId, list);
  }
  const channelStats: KeywordChannelStats[] = Array.from(byChannel.entries())
    .map(([cid, list]) => {
      const cm = channelMetaMap.get(cid);
      const totalViews = list.reduce((s, v) => s + v.viewCount, 0);
      const spreadValues = list
        .map((v) => v.spreadRate)
        .filter((x): x is number => x !== null);
      const avgSpreadRate =
        spreadValues.length > 0
          ? Math.round(
              (spreadValues.reduce((s, x) => s + x, 0) / spreadValues.length) *
                100,
            ) / 100
          : null;
      return {
        channelId: cid,
        channelTitle: cm?.title ?? list[0].channelTitle,
        thumbnailUrl: cm?.thumbnailUrl ?? null,
        subscriberCount: cm?.subscriberCount ?? null,
        videoCount: list.length,
        totalViews,
        avgViews: Math.round(totalViews / list.length),
        avgSpreadRate,
      };
    })
    .sort((a, b) => b.videoCount - a.videoCount)
    .slice(0, 10);

  // 6) 伸び率分布
  const buckets = [
    { bucket: "unknown", min: -Infinity, max: -Infinity }, // null
    { bucket: "<30%", min: 0, max: 30 },
    { bucket: "30–99%", min: 30, max: 100 },
    { bucket: "100–499%", min: 100, max: 500 },
    { bucket: "500%+", min: 500, max: Infinity },
  ];
  const histogram = buckets.map((b) => {
    let count: number;
    if (b.bucket === "unknown") {
      count = enriched.filter((v) => v.spreadRate === null).length;
    } else {
      count = enriched.filter(
        (v) => v.spreadRate !== null && v.spreadRate >= b.min && v.spreadRate < b.max,
      ).length;
    }
    return { bucket: b.bucket, count };
  });

  const totalViews = enriched.reduce((s, v) => s + v.viewCount, 0);
  const avgViews = enriched.length > 0 ? Math.round(totalViews / enriched.length) : 0;

  return {
    keyword: input.keyword,
    totalVideos: enriched.length,
    totalViews,
    avgViews,
    channelCount: channelIdSet.size,
    topChannels: channelStats,
    videos: enriched,
    histogram,
    quotaSpent,
  };
}

function emptyResult(keyword: string, quotaSpent: number): MarketResearchResult {
  return {
    keyword,
    totalVideos: 0,
    totalViews: 0,
    avgViews: 0,
    channelCount: 0,
    topChannels: [],
    videos: [],
    histogram: [],
    quotaSpent,
  };
}

// fetchChannelMeta は market-research 内で個別 channel を取得する補助用 (将来用)
export { fetchChannelMeta };
