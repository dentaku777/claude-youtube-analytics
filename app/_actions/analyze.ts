"use server";

import { ApiProvider } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { getApiKey } from "@/lib/api-keys/vault";
import { createYouTubeClient } from "@/lib/youtube/api/client";
import { resolveChannelId } from "@/lib/youtube/api/resolver";
import {
  fetchChannelData,
  type FetchChannelDataResult,
  type Period,
  periodToCutoffDate,
} from "@/lib/youtube/api/fetcher";
import { enrichVideosWithKpi, type VideoWithKpi } from "@/lib/youtube/kpi/video";
import { calcChannelKpi, type ChannelKpi } from "@/lib/youtube/kpi/channel";
import {
  buildTrend,
  type TrendGranularity,
  type TrendPoint,
} from "@/lib/youtube/kpi/trend";
import { recordQuota } from "@/lib/youtube/quota/tracker";
import { YouTubeApiError } from "@/lib/youtube/api/errors";
import type { ChannelMeta } from "@/lib/youtube/types";

export type VideoTypeFilter = "all" | "shorts" | "regular";

export interface AnalyzeOk {
  ok: true;
  channelMeta: ChannelMeta;
  videos: VideoWithKpi[];
  channelKpi: ChannelKpi;
  trend: TrendPoint[];
  trendGranularity: TrendGranularity;
  quotaSpent: number;
}

export interface AnalyzeFail {
  ok: false;
  code: string;
  message: string;
}

export type AnalyzeResult = AnalyzeOk | AnalyzeFail;

export interface AnalyzeChannelInput {
  input: string;
  period: Period;
  videoType?: VideoTypeFilter;
  /** 勝ち動画判定の伸び率閾値 (%)。省略時 100。 */
  hitThreshold?: number;
}

/**
 * /search 画面のメイン処理。
 *  1. ユーザーの YouTube API キーを取得 (DB から復号)
 *  2. 入力からチャンネル ID を解決
 *  3. メタ + 動画一覧を取得
 *  4. KPI 計算 + フィルタ
 *
 * Server Component / Server Action から呼び出し可能。
 */
export async function analyzeChannel(
  input: AnalyzeChannelInput,
): Promise<AnalyzeResult> {
  const user = await requireUser();

  // 1) キー取得
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
    // 2) チャンネル ID 解決
    const { channelId } = await resolveChannelId(input.input, client);

    // 3) データ取得 (期間フィルタは fetcher 内部で実施)
    const data: FetchChannelDataResult = await fetchChannelData(
      channelId,
      client,
      { period: input.period },
    );

    // 4) 動画タイプフィルタ
    let videos = data.videos;
    if (input.videoType === "shorts") {
      videos = videos.filter((v) => v.isShort);
    } else if (input.videoType === "regular") {
      videos = videos.filter((v) => !v.isShort);
    }

    // 5) KPI 付与 (勝ち動画閾値はユーザー設定を反映)
    const enriched = enrichVideosWithKpi(
      videos,
      data.meta.subscriberCount,
      input.hitThreshold ?? 100,
    );

    // 6) チャンネル KPI 計算
    const cutoff = periodToCutoffDate(input.period);
    const periodDays = cutoff
      ? Math.floor(
          (Date.now() - cutoff.getTime()) / (24 * 60 * 60 * 1000),
        )
      : null;
    const channelKpi = calcChannelKpi(data.meta, enriched, periodDays);

    // 7) 推移グラフ (期間に合わせて粒度・バケット数を変える)
    const { granularity, buckets } = trendConfigFor(input.period, data.videos);
    const trend = buildTrend(data.videos, granularity, buckets);

    // 8) Quota 消費を記録 (成功時のみ)
    await recordQuota(user.id, data.quotaSpent);

    return {
      ok: true,
      channelMeta: data.meta,
      videos: enriched,
      channelKpi,
      trend,
      trendGranularity: granularity,
      quotaSpent: data.quotaSpent,
    };
  } catch (e) {
    if (e instanceof YouTubeApiError) {
      return { ok: false, code: e.code, message: e.toDisplayMessage() };
    }
    console.error("analyzeChannel unexpected error:", e);
    return {
      ok: false,
      code: "UNKNOWN",
      message: e instanceof Error ? e.message : "予期しないエラーが発生しました",
    };
  }
}

/**
 * 期間プリセットから推移グラフの粒度とバケット数を決定する。
 * - 1w / 1m: 日次 (バケット数 7 / 30)
 * - 3m / 6m / 1y / 3y / 6y: 月次 (期間月数)
 * - all: 月次 (取得済み最古動画から現在までの月数、最小 12)
 */
function trendConfigFor(
  period: Period,
  videos: { publishedAt: Date }[],
  now: Date = new Date(),
): { granularity: TrendGranularity; buckets: number } {
  switch (period) {
    case "1w":
      return { granularity: "day", buckets: 7 };
    case "1m":
      return { granularity: "day", buckets: 30 };
    case "3m":
      return { granularity: "month", buckets: 3 };
    case "6m":
      return { granularity: "month", buckets: 6 };
    case "1y":
      return { granularity: "month", buckets: 12 };
    case "3y":
      return { granularity: "month", buckets: 36 };
    case "6y":
      return { granularity: "month", buckets: 72 };
    case "all": {
      if (videos.length === 0) {
        return { granularity: "month", buckets: 12 };
      }
      const earliest = videos.reduce(
        (acc, v) => (v.publishedAt < acc ? v.publishedAt : acc),
        videos[0].publishedAt,
      );
      const months =
        (now.getFullYear() - earliest.getFullYear()) * 12 +
        (now.getMonth() - earliest.getMonth()) +
        1;
      return { granularity: "month", buckets: Math.max(12, months) };
    }
  }
}
