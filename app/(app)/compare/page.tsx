import type { Metadata } from "next";
import { ArrowLeftRight } from "lucide-react";
import { ApiProvider } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { hasApiKey } from "@/lib/api-keys/vault";
import { compareChannels } from "@/app/_actions/compare";
import type { Period } from "@/lib/youtube/api/fetcher";
import type { VideoTypeFilter } from "@/app/_actions/analyze";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyMissingPanel } from "@/components/empty-state/KeyMissingPanel";
import { PlaceholderPanel } from "@/components/empty-state/PlaceholderPanel";
import { ExportButtons } from "@/components/export/ExportButtons";
import { CompareForm } from "./_components/CompareForm";
import { CompareChannelCards } from "./_components/CompareChannelCards";
import { CompareTrendLines } from "./_components/CompareTrendLines";
import {
  CompareVideoTable,
  type CompareVideoEntry,
} from "./_components/CompareVideoTable";

export const metadata: Metadata = { title: "Compare" };

const VALID_PERIODS: Period[] = ["1w", "1m", "3m", "6m", "1y", "3y", "6y", "all"];
const VALID_TYPES: VideoTypeFilter[] = ["all", "shorts", "regular"];

function parsePeriod(s: string | undefined): Period {
  return s && (VALID_PERIODS as string[]).includes(s) ? (s as Period) : "3m";
}
function parseType(s: string | undefined): VideoTypeFilter {
  return s && (VALID_TYPES as string[]).includes(s)
    ? (s as VideoTypeFilter)
    : "all";
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ inputs?: string; period?: string; type?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const inputs = (params.inputs ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  const period = parsePeriod(params.period);
  const videoType = parseType(params.type);

  const hasKey = await hasApiKey(user.id, ApiProvider.YOUTUBE);
  if (!hasKey) {
    return <KeyMissingPanel pageLabel="チャンネル比較" />;
  }

  if (inputs.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">
            チャンネル比較
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            最大 3 チャンネルを並列で分析し、KPI と推移を重ね合わせます。
          </p>
        </header>
        <CompareForm />
        <PlaceholderPanel
          title="比較するチャンネルを入力してください"
          description="1〜3 チャンネル分の URL / @ハンドル / channel ID を入力して「比較」を押します。"
          icon={ArrowLeftRight}
          phase="↑ 入力後ここに結果が表示されます"
        />
      </div>
    );
  }

  const { results, totalQuotaSpent } = await compareChannels({
    inputs,
    period,
    videoType,
  });

  const okResults = results.filter((r): r is Extract<typeof r, { ok: true }> => r.ok);
  const failures = results
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => !r.ok);

  const mergedVideos: CompareVideoEntry[] = okResults.flatMap((r, idx) =>
    r.videos.map((v) => ({
      ...v,
      channelIndex: idx,
      channelTitle: r.channelMeta.title,
    })),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          チャンネル比較
        </h1>
      </header>

      <CompareForm />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          対象: <span className="text-foreground">{inputs.length} ch</span>
          {" · 期間: "}
          <span className="text-foreground">{period}</span>
          {" · 動画: "}
          <span className="text-foreground">{videoType}</span>
        </span>
        <span>
          Quota 消費:{" "}
          <span className="font-mono text-foreground">{totalQuotaSpent}</span>{" "}
          ユニット
        </span>
      </div>

      {failures.map(({ r, i }) =>
        r.ok ? null : (
          <Alert key={i} variant="destructive">
            <AlertDescription>
              <strong className="block">
                チャンネル {i + 1} の分析に失敗しました ({r.code})
              </strong>
              <span className="text-xs">{r.message}</span>
            </AlertDescription>
          </Alert>
        ),
      )}

      {okResults.length > 0 && (
        <>
          <CompareChannelCards
            channels={okResults.map((r) => ({
              meta: r.channelMeta,
              kpi: r.channelKpi,
            }))}
          />

          <CompareTrendLines
            series={okResults.map((r) => ({
              label: r.channelMeta.title,
              trend: r.trend,
            }))}
            granularity={okResults[0].trendGranularity}
            title={`過去 ${period}`}
          />

          <ExportButtons
            query={{
              type: "compare",
              inputs: inputs.join(","),
              period,
              videoType,
            }}
            tsvRows={mergedVideos.map((v) => ({
              ...v,
              channelTitle: v.channelTitle,
            }))}
          />

          <CompareVideoTable videos={mergedVideos} />
        </>
      )}
    </div>
  );
}
