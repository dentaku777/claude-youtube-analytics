"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { getApiKey } from "@/lib/api-keys/vault";
import { createYouTubeClient } from "@/lib/youtube/api/client";
import { resolveChannelId } from "@/lib/youtube/api/resolver";
import { fetchChannelData } from "@/lib/youtube/api/fetcher";
import { recordQuota } from "@/lib/youtube/quota/tracker";
import { YouTubeApiError } from "@/lib/youtube/api/errors";
import { setAnalysisCache } from "@/lib/cache/analysis-cache";

export const MAX_WATCHLIST_CHANNELS = 30;

export interface WatchlistResult {
  ok: boolean;
  message?: string;
  code?: string;
}

/**
 * ユーザーの Watchlist を取得 (なければ作成)
 */
async function getOrCreateWatchlist(userId: string) {
  return prisma.watchlist.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

// ─── Add ───
const addSchema = z.object({
  input: z.string().min(1, "チャンネルを入力してください"),
});

export async function addToWatchlist(input: unknown): Promise<WatchlistResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "入力が無効です" };
  }
  const user = await requireUser();
  const apiKey = await getApiKey(user.id, ApiProvider.YOUTUBE);
  if (!apiKey) {
    return {
      ok: false,
      code: "NO_API_KEY",
      message: "YouTube API キーが登録されていません",
    };
  }

  const watchlist = await getOrCreateWatchlist(user.id);

  // 上限チェック (F-WATCH-06)
  const count = await prisma.watchlistChannel.count({
    where: { watchlistId: watchlist.id },
  });
  if (count >= MAX_WATCHLIST_CHANNELS) {
    return {
      ok: false,
      code: "LIMIT_REACHED",
      message: `Watchlist 上限 ${MAX_WATCHLIST_CHANNELS} ch に達しています`,
    };
  }

  const client = createYouTubeClient(apiKey);
  try {
    const { channelId, quotaSpent: q1 } = await resolveChannelId(
      parsed.data.input,
      client,
    );

    // 既存重複チェック
    const existing = await prisma.watchlistChannel.findUnique({
      where: { watchlistId_channelId: { watchlistId: watchlist.id, channelId } },
    });
    if (existing) {
      return { ok: false, code: "DUPLICATE", message: "既に Watchlist に登録されています" };
    }

    // メタ情報取得 (登録時の最低限のスナップショット)
    const data = await fetchChannelData(channelId, client, { period: "3m" });
    await recordQuota(user.id, q1 + data.quotaSpent);

    await prisma.watchlistChannel.create({
      data: {
        watchlistId: watchlist.id,
        channelId: data.meta.channelId,
        channelTitle: data.meta.title,
        channelHandle: data.meta.handle ?? null,
        thumbnailUrl: data.meta.thumbnailUrl ?? null,
        lastAnalyzedAt: new Date(),
      },
    });

    // 即時にキャッシュも作っておく
    await setAnalysisCache(data.meta.channelId, "3m", {
      meta: data.meta,
      videos: data.videos,
    });

    revalidatePath("/watchlist");
    revalidatePath("/search");
    return { ok: true, message: "Watchlist に追加しました" };
  } catch (e) {
    if (e instanceof YouTubeApiError) {
      return { ok: false, code: e.code, message: e.toDisplayMessage() };
    }
    console.error("addToWatchlist error:", e);
    return { ok: false, code: "UNKNOWN", message: "追加に失敗しました" };
  }
}

// ─── Remove ───
const removeSchema = z.object({
  channelId: z.string().min(1),
});

export async function removeFromWatchlist(
  input: unknown,
): Promise<WatchlistResult> {
  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "入力が無効です" };
  const user = await requireUser();
  const watchlist = await getOrCreateWatchlist(user.id);

  await prisma.watchlistChannel.deleteMany({
    where: { watchlistId: watchlist.id, channelId: parsed.data.channelId },
  });

  revalidatePath("/watchlist");
  return { ok: true, message: "Watchlist から削除しました" };
}

// ─── Update tags / memo ───
const updateMetaSchema = z.object({
  channelId: z.string().min(1),
  tags: z.array(z.string().max(40)).max(20).optional(),
  memo: z.string().max(4000).optional(),
});

export async function updateWatchlistChannelMeta(
  input: unknown,
): Promise<WatchlistResult> {
  const parsed = updateMetaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "入力が無効です" };
  }
  const user = await requireUser();
  const watchlist = await getOrCreateWatchlist(user.id);

  const { channelId, tags, memo } = parsed.data;
  const data: { tags?: string[]; memo?: string } = {};
  if (tags !== undefined) data.tags = tags;
  if (memo !== undefined) data.memo = memo;

  await prisma.watchlistChannel.updateMany({
    where: { watchlistId: watchlist.id, channelId },
    data,
  });

  revalidatePath("/watchlist");
  return { ok: true, message: "保存しました" };
}

// ─── Refresh single ───
export async function refreshWatchlistChannel(
  input: unknown,
): Promise<WatchlistResult> {
  const parsed = removeSchema.safeParse(input); // 同じ shape (channelId)
  if (!parsed.success) return { ok: false, message: "入力が無効です" };
  const user = await requireUser();
  const apiKey = await getApiKey(user.id, ApiProvider.YOUTUBE);
  if (!apiKey) {
    return {
      ok: false,
      code: "NO_API_KEY",
      message: "YouTube API キーが登録されていません",
    };
  }

  const client = createYouTubeClient(apiKey);
  try {
    const data = await fetchChannelData(parsed.data.channelId, client, {
      period: "3m",
    });
    await recordQuota(user.id, data.quotaSpent);
    await setAnalysisCache(parsed.data.channelId, "3m", {
      meta: data.meta,
      videos: data.videos,
    });
    const watchlist = await getOrCreateWatchlist(user.id);
    await prisma.watchlistChannel.updateMany({
      where: { watchlistId: watchlist.id, channelId: parsed.data.channelId },
      data: { lastAnalyzedAt: new Date() },
    });
    revalidatePath("/watchlist");
    return { ok: true, message: "更新しました" };
  } catch (e) {
    if (e instanceof YouTubeApiError) {
      return { ok: false, code: e.code, message: e.toDisplayMessage() };
    }
    return { ok: false, code: "UNKNOWN", message: "更新に失敗しました" };
  }
}

// ─── Refresh all (bulk) ───
export interface BulkRefreshResult extends WatchlistResult {
  succeeded: number;
  failed: number;
  totalQuota: number;
}

export async function refreshAllWatchlist(): Promise<BulkRefreshResult> {
  const user = await requireUser();
  const apiKey = await getApiKey(user.id, ApiProvider.YOUTUBE);
  if (!apiKey) {
    return {
      ok: false,
      code: "NO_API_KEY",
      message: "YouTube API キーが登録されていません",
      succeeded: 0,
      failed: 0,
      totalQuota: 0,
    };
  }

  const watchlist = await getOrCreateWatchlist(user.id);
  const channels = await prisma.watchlistChannel.findMany({
    where: { watchlistId: watchlist.id },
    select: { channelId: true },
    orderBy: { addedAt: "asc" },
  });

  const client = createYouTubeClient(apiKey);
  let succeeded = 0;
  let failed = 0;
  let totalQuota = 0;

  // 順次処理 (Quota 配慮)
  for (const ch of channels) {
    try {
      const data = await fetchChannelData(ch.channelId, client, {
        period: "3m",
      });
      totalQuota += data.quotaSpent;
      await setAnalysisCache(ch.channelId, "3m", {
        meta: data.meta,
        videos: data.videos,
      });
      await prisma.watchlistChannel.updateMany({
        where: { watchlistId: watchlist.id, channelId: ch.channelId },
        data: { lastAnalyzedAt: new Date() },
      });
      succeeded++;
    } catch (e) {
      failed++;
      console.error(`bulk refresh failed for ${ch.channelId}:`, e);
    }
  }

  await recordQuota(user.id, totalQuota);
  revalidatePath("/watchlist");
  return {
    ok: true,
    succeeded,
    failed,
    totalQuota,
    message: `${succeeded} 件成功 / ${failed} 件失敗 (Quota ${totalQuota})`,
  };
}
