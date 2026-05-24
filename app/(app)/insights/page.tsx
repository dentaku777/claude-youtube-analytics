import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, AlertCircle } from "lucide-react";
import { ApiProvider } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { hasApiKey } from "@/lib/api-keys/vault";
import { prisma } from "@/lib/prisma";
import { KeyMissingPanel } from "@/components/empty-state/KeyMissingPanel";
import { PlaceholderPanel } from "@/components/empty-state/PlaceholderPanel";
import { aggregateInsightsData } from "@/lib/insights/aggregate";
import { extractHitPatterns } from "@/lib/insights/pattern-extractor";
import { buildPostingHeatmap } from "@/lib/insights/heatmap";
import { analyzeTitleKeywords } from "@/lib/insights/keyword-analyzer";
import { InsightsControls } from "./_components/InsightsControls";
import { HitPatternPanel } from "./_components/HitPatternPanel";
import { PostingHeatmap } from "./_components/PostingHeatmap";
import { ThumbnailGallery } from "./_components/ThumbnailGallery";
import { KeywordFreqTable } from "./_components/KeywordFreqTable";
import { DurationScatter } from "./_components/DurationScatter";
import { EngagementPanel } from "./_components/EngagementPanel";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ channels?: string }>;
}) {
  const user = await requireUser();
  const hasKey = await hasApiKey(user.id, ApiProvider.YOUTUBE);
  if (!hasKey) {
    return <KeyMissingPanel pageLabel="Insights" />;
  }

  const watchlist = await prisma.watchlist.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
    include: { channels: { orderBy: { addedAt: "asc" } } },
  });

  if (watchlist.channels.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">
            横断インサイト
          </h1>
        </header>
        <PlaceholderPanel
          title="Watchlist にチャンネルを追加してください"
          description="Insights は Watchlist に登録した複数チャンネルを横断して分析します。"
          icon={BarChart3}
          phase="↑ /watchlist でチャンネル登録後、この画面で分析"
        />
      </div>
    );
  }

  const params = await searchParams;
  const requestedIds = (params.channels ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const selected =
    requestedIds.length > 0
      ? watchlist.channels.filter((c) => requestedIds.includes(c.channelId))
      : watchlist.channels;

  const { videos, missingChannels } = await aggregateInsightsData(
    selected.map((c) => ({
      channelId: c.channelId,
      channelTitle: c.channelTitle,
    })),
  );

  const hitPatterns = extractHitPatterns(videos);
  const heatmap = buildPostingHeatmap(videos);
  const keywords = videos.length > 0 ? await analyzeTitleKeywords(videos) : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          横断インサイト
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Watchlist 内チャンネルを横断して市場パターンを抽出します。
        </p>
      </header>

      <InsightsControls
        channels={watchlist.channels.map((c) => ({
          channelId: c.channelId,
          channelTitle: c.channelTitle,
        }))}
        selectedChannelIds={selected.map((c) => c.channelId)}
      />

      {missingChannels.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong className="block">
              {missingChannels.length} チャンネルのキャッシュがありません
            </strong>
            <span className="text-xs">
              {missingChannels.map((c) => c.channelTitle).join(", ")}
            </span>
            <div className="mt-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/watchlist">/watchlist で「全件再分析」を実行</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {videos.length === 0 ? (
        <PlaceholderPanel
          title="分析対象データがありません"
          description="選択チャンネルの分析キャッシュがありません。/watchlist で再分析してください。"
          icon={BarChart3}
        />
      ) : (
        <>
          <div className="text-xs text-muted-foreground">
            対象: <span className="text-foreground">{selected.length} ch</span>
            {" · 動画数: "}
            <span className="font-mono text-foreground">{videos.length}</span>
            {" · 勝ち動画: "}
            <span className="font-mono text-lime-400">
              {hitPatterns.hitCount}
            </span>
          </div>

          <HitPatternPanel stats={hitPatterns} />

          <div className="grid gap-6 lg:grid-cols-2">
            <PostingHeatmap data={heatmap} />
            <EngagementPanel videos={videos} />
          </div>

          <DurationScatter videos={videos} />

          <KeywordFreqTable rows={keywords} />

          <ThumbnailGallery videos={videos} />
        </>
      )}
    </div>
  );
}
