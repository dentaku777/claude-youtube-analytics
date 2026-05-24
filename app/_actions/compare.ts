"use server";

import { SearchType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { analyzeChannel, type AnalyzeResult } from "@/app/_actions/analyze";
import type { Period } from "@/lib/youtube/api/fetcher";
import type { VideoTypeFilter } from "@/app/_actions/analyze";

export interface CompareInput {
  inputs: string[]; // 1〜3 件
  period: Period;
  videoType?: VideoTypeFilter;
  hitThreshold?: number;
}

export interface CompareResult {
  results: AnalyzeResult[]; // 入力順に対応
  totalQuotaSpent: number;
}

/**
 * 最大 3 チャンネルを並列に分析する (F-COMPARE-02)。
 * 各チャンネルは独立に成功/失敗するため、results に AnalyzeResult が並ぶ。
 */
export async function compareChannels(
  input: CompareInput,
): Promise<CompareResult> {
  const inputs = input.inputs
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 3);

  if (inputs.length === 0) {
    return { results: [], totalQuotaSpent: 0 };
  }

  const user = await requireUser();
  const results = await Promise.all(
    inputs.map((s) =>
      analyzeChannel({
        input: s,
        period: input.period,
        videoType: input.videoType,
        hitThreshold: input.hitThreshold,
      }),
    ),
  );

  const totalQuotaSpent = results.reduce(
    (sum, r) => sum + (r.ok ? r.quotaSpent : 0),
    0,
  );

  // 比較全体の履歴を 1 件記録 (個別 analyzeChannel が SEARCH 履歴を 3 件作っているが
  // それとは別に COMPARE スコープで残す)
  if (results.some((r) => r.ok)) {
    const channelInfo = results
      .map((r, i) =>
        r.ok
          ? {
              input: inputs[i],
              channelId: r.channelMeta.channelId,
              title: r.channelMeta.title,
            }
          : { input: inputs[i], error: r.code },
      );
    await prisma.searchHistory.create({
      data: {
        userId: user.id,
        type: SearchType.COMPARE,
        channels: channelInfo as unknown as Prisma.InputJsonValue,
        period: input.period,
        filters: {
          videoType: input.videoType ?? "all",
        } as unknown as Prisma.InputJsonValue,
        resultMeta: {
          totalQuotaSpent,
          successCount: results.filter((r) => r.ok).length,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  return { results, totalQuotaSpent };
}
