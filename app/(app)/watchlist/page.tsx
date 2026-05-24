import type { Metadata } from "next";
import { ApiProvider } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { hasApiKey } from "@/lib/api-keys/vault";
import { prisma } from "@/lib/prisma";
import { KeyMissingPanel } from "@/components/empty-state/KeyMissingPanel";
import {
  getAnalysisCache,
  type CachePeriod,
} from "@/lib/cache/analysis-cache";
import { calcChannelKpi } from "@/lib/youtube/kpi/channel";
import { enrichVideosWithKpi } from "@/lib/youtube/kpi/video";
import { AddChannelForm } from "./_components/AddChannelForm";
import { BulkRefreshButton } from "./_components/BulkRefreshButton";
import { WatchlistView } from "./_components/WatchlistView";
import type { WatchlistRow } from "./_components/WatchlistTable";
import { MAX_WATCHLIST_CHANNELS } from "@/app/_actions/watchlist";

export const metadata: Metadata = { title: "Watchlist" };

const CACHE_PERIOD: CachePeriod = "3m";

export default async function WatchlistPage() {
  const user = await requireUser();
  const hasKey = await hasApiKey(user.id, ApiProvider.YOUTUBE);
  if (!hasKey) {
    return <KeyMissingPanel pageLabel="Watchlist" />;
  }

  const watchlist = await prisma.watchlist.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
    include: { channels: { orderBy: { addedAt: "desc" } } },
  });

  // 各 ch のキャッシュから集計値を取得 (なければ null)
  const rows: WatchlistRow[] = await Promise.all(
    watchlist.channels.map(async (ch) => {
      const cache = await getAnalysisCache(ch.channelId, CACHE_PERIOD);
      let subscriberCount: number | null | undefined = undefined;
      let videoCount: number | null | undefined = undefined;
      let avgSpreadRate: number | null | undefined = undefined;

      if (cache) {
        const enriched = enrichVideosWithKpi(
          cache.videos,
          cache.meta.subscriberCount,
        );
        const kpi = calcChannelKpi(cache.meta, enriched, 90);
        subscriberCount = kpi.subscriberCount;
        videoCount = kpi.videoCount;
        avgSpreadRate = kpi.avgSpreadRate;
      }

      return {
        id: ch.id,
        channelId: ch.channelId,
        channelTitle: ch.channelTitle,
        channelHandle: ch.channelHandle,
        thumbnailUrl: ch.thumbnailUrl,
        tags: ch.tags,
        memo: ch.memo,
        addedAt: ch.addedAt,
        lastAnalyzedAt: ch.lastAnalyzedAt,
        subscriberCount,
        videoCount,
        avgSpreadRate,
      };
    }),
  );

  const count = rows.length;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Watchlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            注視チャンネルを最大 {MAX_WATCHLIST_CHANNELS} ch まで登録。
            <span className="ml-2 font-mono text-foreground">
              {count} / {MAX_WATCHLIST_CHANNELS}
            </span>
          </p>
        </div>
        <BulkRefreshButton channelCount={count} />
      </header>

      <AddChannelForm />

      <WatchlistView rows={rows} />
    </div>
  );
}
