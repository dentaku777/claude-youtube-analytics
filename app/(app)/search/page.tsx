import type { Metadata } from "next";
import { Search } from "lucide-react";
import { ApiProvider } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { hasApiKey } from "@/lib/api-keys/vault";
import { analyzeChannel, type VideoTypeFilter } from "@/app/_actions/analyze";
import type { Period } from "@/lib/youtube/api/fetcher";
import { getUserPreference } from "@/lib/preference/get";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyMissingPanel } from "@/components/empty-state/KeyMissingPanel";
import { PlaceholderPanel } from "@/components/empty-state/PlaceholderPanel";
import { ExportButtons } from "@/components/export/ExportButtons";
import { SearchForm } from "./_components/SearchForm";
import { ChannelHeader } from "./_components/ChannelHeader";
import { VideoTable } from "./_components/VideoTable";
import { TrendChart } from "./_components/TrendChart";

export const metadata: Metadata = { title: "Search" };

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

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ input?: string; period?: string; type?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const input = params.input?.trim();
  const period = parsePeriod(params.period);
  const videoType = parseType(params.type);

  // 1) API キー未登録チェック
  const hasKey = await hasApiKey(user.id, ApiProvider.YOUTUBE);
  if (!hasKey) {
    return <KeyMissingPanel pageLabel="単一チャンネル分析" />;
  }

  // 表示設定 (列・件数・勝ち動画閾値)
  const preference = await getUserPreference(user.id);

  // 2) 入力なしならフォームのみ表示
  if (!input) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">単一チャンネル分析</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            YouTube チャンネルの URL / @ハンドル / channel ID を入力して分析を開始します。
          </p>
        </header>
        <SearchForm />
        <PlaceholderPanel
          title="チャンネルを入力してください"
          description="期間と動画タイプを選んで「分析」ボタンを押すと、KPI と動画一覧が表示されます。"
          icon={Search}
          phase="↑ 入力後ここに結果が表示されます"
        />
      </div>
    );
  }

  // 3) 分析実行 (Server Component で直接 await)
  const result = await analyzeChannel({
    input,
    period,
    videoType,
    hitThreshold: preference.hitThreshold,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">単一チャンネル分析</h1>
      </header>

      <SearchForm />

      {!result.ok && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong className="block">分析に失敗しました ({result.code})</strong>
            <span className="text-xs">{result.message}</span>
          </AlertDescription>
        </Alert>
      )}

      {result.ok && (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              対象期間: <span className="text-foreground">{periodLabel(period)}</span>
              {" · "}
              動画タイプ: <span className="text-foreground">{typeLabel(videoType)}</span>
              {" · "}
              取得件数:{" "}
              <span className="font-mono text-foreground">{result.videos.length}</span>
            </span>
            <span>
              Quota 消費: <span className="font-mono text-foreground">{result.quotaSpent}</span> ユニット
            </span>
          </div>

          <ChannelHeader meta={result.channelMeta} kpi={result.channelKpi} />

          <TrendChart
            data={result.trend}
            granularity={result.trendGranularity}
            title={`過去 ${periodLabel(period)}`}
          />

          <ExportButtons
            query={{
              type: "search",
              input,
              period,
              videoType,
            }}
            tsvRows={result.videos.map((v) => ({
              ...v,
              channelTitle: result.channelMeta.title,
            }))}
          />

          <VideoTable
            videos={result.videos}
            visibleColumns={preference.visibleColumns}
            pageSize={preference.pageSize}
          />
        </>
      )}
    </div>
  );
}

function periodLabel(p: Period): string {
  return (
    {
      "1w": "1 週間",
      "1m": "1 ヶ月",
      "3m": "3 ヶ月",
      "6m": "6 ヶ月",
      "1y": "1 年",
      "3y": "3 年",
      "6y": "6 年",
      all: "全期間",
    } as const
  )[p];
}

function typeLabel(t: VideoTypeFilter): string {
  return { all: "すべて", shorts: "Shorts のみ", regular: "通常動画のみ" }[t];
}
