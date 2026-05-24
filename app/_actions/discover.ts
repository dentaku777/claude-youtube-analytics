"use server";

import { ApiProvider, SearchType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { getApiKey } from "@/lib/api-keys/vault";
import { createYouTubeClient } from "@/lib/youtube/api/client";
import { resolveChannelId } from "@/lib/youtube/api/resolver";
import { fetchChannelData } from "@/lib/youtube/api/fetcher";
import { recordQuota } from "@/lib/youtube/quota/tracker";
import { YouTubeApiError } from "@/lib/youtube/api/errors";
import { QUOTA_COST } from "@/lib/youtube/quota/cost";
import { extractSeedKeywords } from "@/lib/discover/seed-keywords";
import { findRelatedChannels } from "@/lib/discover/related-finder";
import {
  scoreCandidate,
  type ScoredCandidate,
} from "@/lib/discover/relevance-scorer";
import { enrichVideosWithKpi } from "@/lib/youtube/kpi/video";
import { calcChannelKpi } from "@/lib/youtube/kpi/channel";
import type { ChannelMeta } from "@/lib/youtube/types";

export interface DiscoverOk {
  ok: true;
  seedMeta: ChannelMeta;
  seedKeywords: string[];
  candidates: ScoredCandidate[];
  quotaSpent: number;
}
export interface DiscoverFail {
  ok: false;
  code: string;
  message: string;
}
export type DiscoverResult = DiscoverOk | DiscoverFail;

export interface DiscoverInput {
  input: string; // seed channel
  maxKeywords?: number;
  maxCandidatesPerKeyword?: number;
}

export async function discoverRelatedChannels(
  input: DiscoverInput,
): Promise<DiscoverResult> {
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
  let quotaSpent = 0;
  try {
    // 1) シードチャンネル特定
    const { channelId, quotaSpent: q1 } = await resolveChannelId(
      input.input,
      client,
    );
    quotaSpent += q1;

    // 2) シードチャンネルのメタ + 直近動画
    const seedData = await fetchChannelData(channelId, client, { period: "3m" });
    quotaSpent += seedData.quotaSpent;

    const seedEnriched = enrichVideosWithKpi(
      seedData.videos,
      seedData.meta.subscriberCount,
    );
    const seedKpi = calcChannelKpi(seedData.meta, seedEnriched, 90);

    // 3) タイトル頻出語抽出
    const seedKeywords = await extractSeedKeywords(
      seedData.videos,
      input.maxKeywords ?? 5,
    );
    if (seedKeywords.length === 0) {
      return {
        ok: false,
        code: "NO_KEYWORDS",
        message: "シードチャンネルからキーワードを抽出できませんでした",
      };
    }

    // 4) search.list で類似チャンネル探索
    const { hits, quotaSpent: q3 } = await findRelatedChannels(client, {
      keywords: seedKeywords,
      excludeChannelId: channelId,
      maxPerKeyword: input.maxCandidatesPerKeyword ?? 20,
    });
    quotaSpent += q3;

    // 5) 上位 30 ch まで絞り、各チャンネルメタ取得
    const top = hits.slice(0, 30);
    const channelIds = top.map((h) => h.channelId);

    // channels.list 50 件単位
    const metaMap = new Map<
      string,
      { subscriberCount: number | null; thumbnailUrl?: string; title: string }
    >();
    for (let i = 0; i < channelIds.length; i += 50) {
      const batch = channelIds.slice(i, i + 50);
      if (batch.length === 0) break;
      const r = await client.get<{
        items?: Array<{
          id: string;
          snippet?: {
            title?: string;
            thumbnails?: { default?: { url?: string }; medium?: { url?: string } };
          };
          statistics?: {
            subscriberCount?: string;
            hiddenSubscriberCount?: boolean;
          };
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
        metaMap.set(it.id, {
          subscriberCount: hidden ? null : subStr ? parseInt(subStr, 10) || 0 : 0,
          thumbnailUrl:
            it.snippet?.thumbnails?.medium?.url ??
            it.snippet?.thumbnails?.default?.url,
          title: it.snippet?.title ?? "",
        });
      }
    }

    // 6) 候補ごとにスコアリング (avgSpreadRate は概算不能のため null)
    const candidates: ScoredCandidate[] = top
      .map((hit) => {
        const cm = metaMap.get(hit.channelId);
        if (!cm) return null;
        return scoreCandidate(
          {
            hit: { ...hit, channelTitle: cm.title || hit.channelTitle },
            subscriberCount: cm.subscriberCount,
            avgSpreadRate: null, // 候補チャンネルの伸び率算出には追加 quota が必要なため省略
            thumbnailUrl: cm.thumbnailUrl,
          },
          {
            subscriberCount: seedData.meta.subscriberCount,
            avgSpreadRate: seedKpi.avgSpreadRate,
            totalKeywords: seedKeywords.length,
          },
        );
      })
      .filter((c): c is ScoredCandidate => c !== null)
      .sort((a, b) => b.score - a.score);

    await recordQuota(user.id, quotaSpent);

    await prisma.searchHistory.create({
      data: {
        userId: user.id,
        type: SearchType.DISCOVER,
        channels: [
          {
            channelId: seedData.meta.channelId,
            title: seedData.meta.title,
          },
        ] as unknown as Prisma.InputJsonValue,
        filters: {
          seedKeywords,
        } as unknown as Prisma.InputJsonValue,
        resultMeta: {
          candidateCount: candidates.length,
          quotaSpent,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      ok: true,
      seedMeta: seedData.meta,
      seedKeywords,
      candidates,
      quotaSpent,
    };
  } catch (e) {
    if (e instanceof YouTubeApiError) {
      return { ok: false, code: e.code, message: e.toDisplayMessage() };
    }
    console.error("discoverRelatedChannels error:", e);
    return { ok: false, code: "UNKNOWN", message: "競合発見に失敗しました" };
  }
}
