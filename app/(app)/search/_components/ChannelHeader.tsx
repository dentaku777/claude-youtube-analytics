import Image from "next/image";
import type { ChannelMeta } from "@/lib/youtube/types";
import type { ChannelKpi } from "@/lib/youtube/kpi/channel";
import {
  compactNumber,
  formatNumber,
  formatPercent,
  formatDate,
} from "@/lib/format";

export function ChannelHeader({
  meta,
  kpi,
}: {
  meta: ChannelMeta;
  kpi: ChannelKpi;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-5">
      {/* チャンネル基本情報 */}
      <div className="flex items-start gap-4">
        {meta.thumbnailUrl ? (
          <Image
            src={meta.thumbnailUrl}
            alt={meta.title}
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-full border border-zinc-800"
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-full bg-zinc-800" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-foreground">
            {meta.title}
          </h1>
          {meta.handle && (
            <p className="font-mono text-xs text-muted-foreground">
              @{meta.handle.replace(/^@/, "")}
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-500">
            開設: {formatDate(meta.publishedAt)}
          </p>
        </div>
      </div>

      {/* KPI グリッド */}
      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4 md:grid-cols-4 lg:grid-cols-7">
        <KpiCell
          label="登録者"
          value={
            kpi.subscriberCount !== null
              ? compactNumber(kpi.subscriberCount)
              : "非公開"
          }
        />
        <KpiCell label="動画本数" value={formatNumber(kpi.videoCount)} />
        <KpiCell label="総再生数" value={compactNumber(kpi.viewCount)} />
        <KpiCell
          label="平均再生数"
          value={
            kpi.avgViewsPerVideo !== null
              ? compactNumber(kpi.avgViewsPerVideo)
              : "-"
          }
        />
        <KpiCell
          label="平均伸び率"
          value={formatPercent(kpi.avgSpreadRate)}
          highlight={
            kpi.avgSpreadRate !== null && kpi.avgSpreadRate >= 100
              ? "win"
              : kpi.avgSpreadRate !== null && kpi.avgSpreadRate >= 30
                ? "healthy"
                : "default"
          }
        />
        <KpiCell
          label="投稿頻度"
          value={
            kpi.postingFrequencyPerDay !== null
              ? `${kpi.postingFrequencyPerDay.toFixed(2)} 本/日`
              : "-"
          }
        />
        <KpiCell
          label="期間内ヒット数"
          value={`${kpi.hitsInPeriod} / ${kpi.videosInPeriod}`}
          highlight={kpi.hitsInPeriod > 0 ? "win" : "default"}
        />
      </div>
    </div>
  );
}

function KpiCell({
  label,
  value,
  highlight = "default",
}: {
  label: string;
  value: string;
  highlight?: "default" | "win" | "healthy";
}) {
  const colorClass =
    highlight === "win"
      ? "text-lime-400"
      : highlight === "healthy"
        ? "text-amber-400"
        : "text-foreground";
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 font-mono text-base tabular-nums ${colorClass}`}>
        {value}
      </p>
    </div>
  );
}
