import Image from "next/image";
import type { ChannelMeta } from "@/lib/youtube/types";
import type { ChannelKpi } from "@/lib/youtube/kpi/channel";
import { compactNumber, formatPercent } from "@/lib/format";
import { COMPARE_COLORS } from "./CompareTrendLines";

export interface CompareChannelCardsProps {
  channels: Array<{ meta: ChannelMeta; kpi: ChannelKpi }>;
}

/**
 * 比較画面用の 3 ch チャンネルカード横並び (F-COMPARE-03)。
 * カードの左端にチャンネル識別カラーを表示。
 */
export function CompareChannelCards({ channels }: CompareChannelCardsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {channels.map((ch, i) => (
        <div
          key={ch.meta.channelId}
          className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4"
          style={{ borderLeft: `4px solid ${COMPARE_COLORS[i]}` }}
        >
          <div className="flex items-start gap-3">
            {ch.meta.thumbnailUrl ? (
              <Image
                src={ch.meta.thumbnailUrl}
                alt={ch.meta.title}
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-full border border-zinc-800"
              />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-800" />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-foreground">
                {ch.meta.title}
              </h2>
              {ch.meta.handle && (
                <p className="font-mono text-[10px] text-muted-foreground">
                  @{ch.meta.handle.replace(/^@/, "")}
                </p>
              )}
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-3 text-xs">
            <KpiRow
              label="登録者"
              value={
                ch.kpi.subscriberCount !== null
                  ? compactNumber(ch.kpi.subscriberCount)
                  : "非公開"
              }
            />
            <KpiRow
              label="動画本数"
              value={compactNumber(ch.kpi.videoCount)}
            />
            <KpiRow
              label="総再生数"
              value={compactNumber(ch.kpi.viewCount)}
            />
            <KpiRow
              label="平均再生数"
              value={
                ch.kpi.avgViewsPerVideo !== null
                  ? compactNumber(ch.kpi.avgViewsPerVideo)
                  : "-"
              }
            />
            <KpiRow
              label="平均伸び率"
              value={formatPercent(ch.kpi.avgSpreadRate)}
              highlight={
                ch.kpi.avgSpreadRate !== null && ch.kpi.avgSpreadRate >= 100
                  ? "win"
                  : ch.kpi.avgSpreadRate !== null && ch.kpi.avgSpreadRate >= 30
                    ? "healthy"
                    : "default"
              }
            />
            <KpiRow
              label="ヒット数"
              value={`${ch.kpi.hitsInPeriod} / ${ch.kpi.videosInPeriod}`}
              highlight={ch.kpi.hitsInPeriod > 0 ? "win" : "default"}
            />
          </dl>
        </div>
      ))}
    </div>
  );
}

function KpiRow({
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
      <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd className={`mt-0.5 font-mono tabular-nums ${colorClass}`}>{value}</dd>
    </div>
  );
}
