import type { YouTubeClient } from "./client";
import { YouTubeApiError } from "./errors";
import { QUOTA_COST } from "../quota/cost";
import type {
  ChannelMeta,
  VideoEntry,
  YTChannelListResponse,
  YTPlaylistItemsResponse,
  YTVideosListResponse,
} from "../types";
import { isShort, parseDurationToSeconds } from "../kpi/duration";

// ─── 期間フィルタ ───
export type Period =
  | "1w"
  | "1m"
  | "3m"
  | "6m"
  | "1y"
  | "3y"
  | "6y"
  | "all";

export function periodToCutoffDate(
  period: Period,
  now: Date = new Date(),
): Date | null {
  const d = new Date(now);
  switch (period) {
    case "1w":
      d.setDate(d.getDate() - 7);
      return d;
    case "1m":
      d.setMonth(d.getMonth() - 1);
      return d;
    case "3m":
      d.setMonth(d.getMonth() - 3);
      return d;
    case "6m":
      d.setMonth(d.getMonth() - 6);
      return d;
    case "1y":
      d.setFullYear(d.getFullYear() - 1);
      return d;
    case "3y":
      d.setFullYear(d.getFullYear() - 3);
      return d;
    case "6y":
      d.setFullYear(d.getFullYear() - 6);
      return d;
    case "all":
      return null;
  }
}

// ─── channels.list ───
export async function fetchChannelMeta(
  channelId: string,
  client: YouTubeClient,
): Promise<{ meta: ChannelMeta; quotaSpent: number }> {
  const response = await client.get<YTChannelListResponse>("channels", {
    part: ["snippet", "statistics", "contentDetails"],
    id: channelId,
    maxResults: 1,
  });

  const item = response.items?.[0];
  if (!item) {
    throw new YouTubeApiError(
      "NOT_FOUND",
      404,
      `チャンネル ${channelId} が見つかりません`,
    );
  }

  const snippet = item.snippet;
  const stats = item.statistics;
  const uploads = item.contentDetails?.relatedPlaylists?.uploads;
  if (!snippet || !uploads) {
    throw new YouTubeApiError(
      "NOT_FOUND",
      404,
      `チャンネル ${channelId} のデータが不完全です (プライベートの可能性)`,
    );
  }

  const meta: ChannelMeta = {
    channelId: item.id,
    title: snippet.title,
    handle: snippet.customUrl,
    description: snippet.description,
    thumbnailUrl:
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.medium?.url ??
      snippet.thumbnails?.default?.url,
    publishedAt: new Date(snippet.publishedAt),
    subscriberCount: stats?.hiddenSubscriberCount
      ? null
      : parseIntOrZero(stats?.subscriberCount),
    videoCount: parseIntOrZero(stats?.videoCount),
    viewCount: parseIntOrZero(stats?.viewCount),
    uploadsPlaylistId: uploads,
  };

  return { meta, quotaSpent: QUOTA_COST.CHANNELS_LIST };
}

// ─── playlistItems.list (ページング) ───
export interface FetchUploadsOptions {
  cutoffDate?: Date | null; // これより古い動画を取得した時点で打ち切り
  maxVideoIds?: number; // 安全上限 (デフォルト 500)
}

export async function fetchUploadVideoIds(
  uploadsPlaylistId: string,
  client: YouTubeClient,
  options: FetchUploadsOptions = {},
): Promise<{ videoIds: string[]; quotaSpent: number }> {
  const cutoff = options.cutoffDate ?? null;
  const max = options.maxVideoIds ?? 500;
  const videoIds: string[] = [];
  let quotaSpent = 0;
  let pageToken: string | undefined;

  while (videoIds.length < max) {
    const response = await client.get<YTPlaylistItemsResponse>("playlistItems", {
      part: ["snippet", "contentDetails"],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken,
    });
    quotaSpent += QUOTA_COST.PLAYLIST_ITEMS_LIST;

    const items = response.items ?? [];
    let stopByDate = false;
    for (const item of items) {
      const videoId =
        item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
      const publishedAt =
        item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt;
      if (!videoId) continue;

      if (cutoff && publishedAt) {
        const date = new Date(publishedAt);
        if (date < cutoff) {
          stopByDate = true;
          break;
        }
      }

      videoIds.push(videoId);
      if (videoIds.length >= max) break;
    }

    if (stopByDate) break;
    if (!response.nextPageToken) break;
    pageToken = response.nextPageToken;
  }

  return { videoIds, quotaSpent };
}

// ─── videos.list (50 件バッチ) ───
export async function fetchVideoDetails(
  videoIds: string[],
  client: YouTubeClient,
): Promise<{ videos: VideoEntry[]; quotaSpent: number }> {
  if (videoIds.length === 0) return { videos: [], quotaSpent: 0 };

  const videos: VideoEntry[] = [];
  let quotaSpent = 0;

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const response = await client.get<YTVideosListResponse>("videos", {
      part: ["snippet", "statistics", "contentDetails"],
      id: batch,
      maxResults: 50,
    });
    quotaSpent += QUOTA_COST.VIDEOS_LIST;

    for (const item of response.items ?? []) {
      const snippet = item.snippet;
      const stats = item.statistics;
      const details = item.contentDetails;
      if (!snippet || !details) continue;

      const durationSec = parseDurationToSeconds(details.duration);
      videos.push({
        videoId: item.id,
        title: snippet.title,
        publishedAt: new Date(snippet.publishedAt),
        durationSec,
        isShort: isShort(durationSec),
        viewCount: parseIntOrZero(stats?.viewCount),
        likeCount: stats?.likeCount ? parseIntOrZero(stats.likeCount) : null,
        commentCount: stats?.commentCount
          ? parseIntOrZero(stats.commentCount)
          : null,
        thumbnailUrl:
          snippet.thumbnails?.high?.url ??
          snippet.thumbnails?.medium?.url ??
          snippet.thumbnails?.default?.url,
        hashtags: extractHashtags(snippet.title, snippet.description),
      });
    }
  }

  return { videos, quotaSpent };
}

// ─── オーケストレータ ───
export interface FetchChannelDataOptions {
  period: Period;
  maxVideos?: number; // Quota 安全上限 (デフォルト 500)
}

export interface FetchChannelDataResult {
  meta: ChannelMeta;
  videos: VideoEntry[];
  quotaSpent: number;
}

/**
 * チャンネル 1 件分の分析データを一括取得する高レベル API。
 * 1. channels.list でメタ + uploads playlist 取得 (1 ユニット)
 * 2. playlistItems.list で動画 ID 一覧 (1 ユニット / ページ、期間で打ち切り)
 * 3. videos.list で詳細取得 (50 件あたり 1 ユニット)
 */
export async function fetchChannelData(
  channelId: string,
  client: YouTubeClient,
  options: FetchChannelDataOptions,
): Promise<FetchChannelDataResult> {
  let quotaSpent = 0;

  const { meta, quotaSpent: q1 } = await fetchChannelMeta(channelId, client);
  quotaSpent += q1;
  if (!meta.uploadsPlaylistId) {
    return { meta, videos: [], quotaSpent };
  }

  const cutoff = periodToCutoffDate(options.period);
  const { videoIds, quotaSpent: q2 } = await fetchUploadVideoIds(
    meta.uploadsPlaylistId,
    client,
    { cutoffDate: cutoff, maxVideoIds: options.maxVideos ?? 500 },
  );
  quotaSpent += q2;

  const { videos, quotaSpent: q3 } = await fetchVideoDetails(videoIds, client);
  quotaSpent += q3;

  // 期間内のものだけに最終フィルタ (PlaylistItems の打ち切りで取りこぼした境界対応)
  const filtered = cutoff
    ? videos.filter((v) => v.publishedAt >= cutoff)
    : videos;

  // 公開日降順でソート
  filtered.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  return { meta, videos: filtered, quotaSpent };
}

// ─── helpers ───
function parseIntOrZero(s: string | undefined | null): number {
  if (!s) return 0;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
}

const HASHTAG_REGEX = /#[\p{L}\p{N}_]+/gu;

/**
 * タイトル + 説明文から #hashtag を抽出する (Unicode 対応、重複排除、出現順)。
 * YouTube は description 先頭の #tag を動画上部に表示するため、両方を対象とする。
 */
export function extractHashtags(
  title: string | undefined,
  description: string | undefined,
): string[] {
  const text = `${title ?? ""}\n${description ?? ""}`;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of text.matchAll(HASHTAG_REGEX)) {
    const tag = m[0];
    if (!seen.has(tag)) {
      seen.add(tag);
      result.push(tag);
    }
  }
  return result;
}
