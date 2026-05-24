import { prisma } from "@/lib/prisma";
import type { ChannelMeta, VideoEntry } from "@/lib/youtube/types";

/**
 * AnalysisCache 抽象化レイヤ (F-SEARCH-17)
 * - TTL: 1 時間
 * - Watchlist 中心の横断データ層: 各画面 (search/insights/keywords等) はここを介して
 *   API 再フェッチを抑制する
 */

export const ANALYSIS_CACHE_TTL_MS = 60 * 60 * 1000; // 1h

export type CachePeriod = "1m" | "3m" | "6m" | "1y" | "all";

export interface AnalysisCachePayload {
  meta: ChannelMeta;
  videos: VideoEntry[];
}

export async function getAnalysisCache(
  channelId: string,
  period: CachePeriod,
  now: Date = new Date(),
): Promise<AnalysisCachePayload | null> {
  const row = await prisma.analysisCache.findUnique({
    where: { channelId_period: { channelId, period } },
  });
  if (!row) return null;
  if (row.expiresAt < now) return null;
  return {
    meta: revivedMeta(row.channelMeta),
    videos: revivedVideos(row.videos),
  };
}

export async function setAnalysisCache(
  channelId: string,
  period: CachePeriod,
  payload: AnalysisCachePayload,
  now: Date = new Date(),
): Promise<void> {
  const expiresAt = new Date(now.getTime() + ANALYSIS_CACHE_TTL_MS);
  // Date を ISO string で保存して JSON 化
  const data = {
    channelId,
    period,
    channelMeta: serializableMeta(payload.meta),
    videos: payload.videos.map(serializableVideo),
    cachedAt: now,
    expiresAt,
  };
  await prisma.analysisCache.upsert({
    where: { channelId_period: { channelId, period } },
    create: data,
    update: data,
  });
}

export async function invalidateAnalysisCache(channelId: string): Promise<void> {
  await prisma.analysisCache.deleteMany({ where: { channelId } });
}

/** 期限切れキャッシュを一掃 (Cron 用) */
export async function cleanupExpiredCaches(
  now: Date = new Date(),
): Promise<number> {
  const { count } = await prisma.analysisCache.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  return count;
}

// ─── JSON 化 / 復元 helpers ───
// Prisma Json 型は Date を直接保持できないため文字列化
type SerializableMeta = Omit<ChannelMeta, "publishedAt"> & {
  publishedAt: string;
};
type SerializableVideo = Omit<VideoEntry, "publishedAt"> & {
  publishedAt: string;
};

function serializableMeta(m: ChannelMeta): SerializableMeta {
  return { ...m, publishedAt: m.publishedAt.toISOString() };
}

function serializableVideo(v: VideoEntry): SerializableVideo {
  return { ...v, publishedAt: v.publishedAt.toISOString() };
}

function revivedMeta(raw: unknown): ChannelMeta {
  const m = raw as SerializableMeta;
  return { ...m, publishedAt: new Date(m.publishedAt) };
}

function revivedVideos(raw: unknown): VideoEntry[] {
  const arr = (raw ?? []) as SerializableVideo[];
  return arr.map((v) => ({ ...v, publishedAt: new Date(v.publishedAt) }));
}
