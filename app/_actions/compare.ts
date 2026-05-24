"use server";

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

  return { results, totalQuotaSpent };
}
