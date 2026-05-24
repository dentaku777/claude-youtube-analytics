/**
 * YouTube Data API v3 レスポンスの型 (本プロジェクトで利用するフィールドのみ抜粋)
 * 公式: https://developers.google.com/youtube/v3/docs
 */

export interface YTThumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface YTThumbnails {
  default?: YTThumbnail;
  medium?: YTThumbnail;
  high?: YTThumbnail;
  standard?: YTThumbnail;
  maxres?: YTThumbnail;
}

// ─── channels.list ───
export interface YTChannel {
  id: string;
  snippet?: {
    title: string;
    description?: string;
    customUrl?: string;
    publishedAt: string;
    thumbnails?: YTThumbnails;
    country?: string;
  };
  statistics?: {
    viewCount?: string; // numeric string
    subscriberCount?: string;
    hiddenSubscriberCount?: boolean;
    videoCount?: string;
  };
  contentDetails?: {
    relatedPlaylists?: {
      uploads?: string;
    };
  };
}

export interface YTChannelListResponse {
  kind: string;
  items?: YTChannel[];
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
}

// ─── playlistItems.list ───
export interface YTPlaylistItem {
  id: string;
  snippet?: {
    publishedAt: string;
    title: string;
    resourceId?: {
      kind: string;
      videoId?: string;
    };
  };
  contentDetails?: {
    videoId: string;
    videoPublishedAt?: string;
  };
}

export interface YTPlaylistItemsResponse {
  kind: string;
  nextPageToken?: string;
  items?: YTPlaylistItem[];
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
}

// ─── videos.list ───
export interface YTVideo {
  id: string;
  snippet?: {
    publishedAt: string;
    title: string;
    description?: string;
    thumbnails?: YTThumbnails;
    channelId: string;
    channelTitle: string;
    tags?: string[];
    categoryId?: string;
    liveBroadcastContent?: string;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
    favoriteCount?: string;
  };
  contentDetails?: {
    duration: string; // ISO 8601 (例: "PT4M13S")
    definition?: "hd" | "sd";
    caption?: string;
  };
}

export interface YTVideosListResponse {
  kind: string;
  items?: YTVideo[];
}

// ─── 内部標準化型 ───
// API レスポンスを KPI 計算しやすい形に整形した内部表現

export interface ChannelMeta {
  channelId: string;
  title: string;
  handle?: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt: Date;
  subscriberCount: number | null; // null = hidden
  videoCount: number;
  viewCount: number;
  uploadsPlaylistId: string | null;
}

export interface VideoEntry {
  videoId: string;
  title: string;
  publishedAt: Date;
  durationSec: number; // ISO 8601 を秒に変換済
  isShort: boolean; // duration <= 60s で判定 (簡易、将来 #shorts タグ対応)
  viewCount: number;
  likeCount: number | null;
  commentCount: number | null;
  thumbnailUrl?: string;
}
