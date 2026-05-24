"use server";

import { ApiProvider } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { getApiKey } from "@/lib/auth/api-key";
import { createYouTubeClient } from "@/lib/youtube/client";
import { resolveChannelId } from "@/lib/youtube/resolver";
import {
  fetchChannelData,
  type FetchChannelDataResult,
  type Period,
  periodToCutoffDate,
} from "@/lib/youtube/fetcher";
import { enrichVideosWithKpi, type VideoWithKpi } from "@/lib/youtube/kpi/video";
import { calcChannelKpi, type ChannelKpi } from "@/lib/youtube/kpi/channel";
import {
  buildMonthlyTrend,
  type MonthlyTrendPoint,
} from "@/lib/youtube/kpi/trend";
import { recordQuota } from "@/lib/youtube/quota-tracker";
import { YouTubeApiError } from "@/lib/youtube/errors";
import type { ChannelMeta } from "@/lib/youtube/types";

export type VideoTypeFilter = "all" | "shorts" | "regular";

export interface AnalyzeOk {
  ok: true;
  channelMeta: ChannelMeta;
  videos: VideoWithKpi[];
  channelKpi: ChannelKpi;
  trend: MonthlyTrendPoint[];
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

    // 5) KPI 付与
    const enriched = enrichVideosWithKpi(videos, data.meta.subscriberCount);

    // 6) チャンネル KPI 計算
    const cutoff = periodToCutoffDate(input.period);
    const periodDays = cutoff
      ? Math.floor(
          (Date.now() - cutoff.getTime()) / (24 * 60 * 60 * 1000),
        )
      : null;
    const channelKpi = calcChannelKpi(data.meta, enriched, periodDays);

    // 7) 推移グラフ用 (常に過去 12 ヶ月)
    const trend = buildMonthlyTrend(data.videos, 12);

    // 8) Quota 消費を記録 (成功時のみ)
    await recordQuota(user.id, data.quotaSpent);

    return {
      ok: true,
      channelMeta: data.meta,
      videos: enriched,
      channelKpi,
      trend,
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
