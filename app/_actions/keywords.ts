"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiProvider, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { getApiKey } from "@/lib/api-keys/vault";
import { createYouTubeClient } from "@/lib/youtube/api/client";
import { recordQuota } from "@/lib/youtube/quota/tracker";
import { YouTubeApiError } from "@/lib/youtube/api/errors";
import {
  researchKeywordMarket,
  type MarketResearchResult,
} from "@/lib/keywords/market-research";

export interface KeywordResearchActionOk {
  ok: true;
  result: MarketResearchResult;
}
export interface KeywordResearchActionFail {
  ok: false;
  code: string;
  message: string;
}
export type KeywordResearchActionResult =
  | KeywordResearchActionOk
  | KeywordResearchActionFail;

const inputSchema = z.object({
  keyword: z.string().min(1, "キーワードを入力してください").max(100),
});

export async function runKeywordResearch(
  input: unknown,
): Promise<KeywordResearchActionResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "BAD_INPUT",
      message: parsed.error.issues[0]?.message ?? "入力が無効です",
    };
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

  const client = createYouTubeClient(apiKey);
  try {
    const result = await researchKeywordMarket(client, {
      keyword: parsed.data.keyword,
    });
    await recordQuota(user.id, result.quotaSpent);

    // 履歴保存 (F-KEYWORD-10)
    await prisma.keywordResearch.create({
      data: {
        userId: user.id,
        keyword: result.keyword,
        totalViews: BigInt(result.totalViews),
        avgViews: BigInt(result.avgViews),
        channelCount: result.channelCount,
        topChannels: result.topChannels as unknown as Prisma.InputJsonValue,
        histogram: result.histogram as unknown as Prisma.InputJsonValue,
        rawData: {
          totalVideos: result.totalVideos,
          quotaSpent: result.quotaSpent,
          videos: result.videos.slice(0, 50).map((v) => ({
            videoId: v.videoId,
            title: v.title,
            channelId: v.channelId,
            channelTitle: v.channelTitle,
            viewCount: v.viewCount,
            spreadRate: v.spreadRate,
          })),
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/keywords");
    revalidatePath("/history");
    return { ok: true, result };
  } catch (e) {
    if (e instanceof YouTubeApiError) {
      return { ok: false, code: e.code, message: e.toDisplayMessage() };
    }
    console.error("runKeywordResearch error:", e);
    return {
      ok: false,
      code: "UNKNOWN",
      message: e instanceof Error ? e.message : "失敗しました",
    };
  }
}
