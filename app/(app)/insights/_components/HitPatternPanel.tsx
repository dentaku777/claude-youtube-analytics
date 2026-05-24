import type { HitPatternStats } from "@/lib/insights/pattern-extractor";

export function HitPatternPanel({ stats }: { stats: HitPatternStats }) {
  const hitRate =
    stats.totalCount > 0 ? (stats.hitCount / stats.totalCount) * 100 : 0;
  const shortsHitRate =
    stats.shortsTotal > 0 ? (stats.shortsHits / stats.shortsTotal) * 100 : 0;
  const regularHitRate =
    stats.regularTotal > 0 ? (stats.regularHits / stats.regularTotal) * 100 : 0;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        勝ち動画パターン
      </h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            全体ヒット率
          </p>
          <p className="mt-1 font-mono text-lg text-lime-400 tabular-nums">
            {hitRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {stats.hitCount} / {stats.totalCount} 本
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Shorts ヒット率
          </p>
          <p className="mt-1 font-mono text-lg text-cyan-400 tabular-nums">
            {shortsHitRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {stats.shortsHits} / {stats.shortsTotal} 本
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            通常動画ヒット率
          </p>
          <p className="mt-1 font-mono text-lg text-amber-400 tabular-nums">
            {regularHitRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {stats.regularHits} / {stats.regularTotal} 本
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground">
          動画尺別ヒット率
        </h4>
        <div className="space-y-1.5">
          {stats.durationBuckets.map((b) => {
            const rate = b.all > 0 ? (b.hits / b.all) * 100 : 0;
            return (
              <div key={b.label} className="flex items-center gap-3 text-xs">
                <span className="w-24 text-muted-foreground">{b.label}</span>
                <div className="relative h-3 flex-1 overflow-hidden rounded bg-zinc-900">
                  <div
                    className="h-full bg-lime-400/60"
                    style={{ width: `${Math.min(100, rate)}%` }}
                  />
                </div>
                <span className="w-20 text-right font-mono tabular-nums">
                  {rate.toFixed(1)}% ({b.hits}/{b.all})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground">
          曜日別ヒット率
        </h4>
        <div className="grid grid-cols-7 gap-1">
          {stats.dayOfWeek.map((d) => {
            const rate = d.all > 0 ? (d.hits / d.all) * 100 : 0;
            return (
              <div key={d.day} className="text-center">
                <p className="text-[10px] text-muted-foreground">{d.label}</p>
                <p className="mt-1 font-mono text-xs tabular-nums text-lime-400">
                  {rate.toFixed(0)}%
                </p>
                <p className="text-[9px] text-zinc-600">
                  {d.hits}/{d.all}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
