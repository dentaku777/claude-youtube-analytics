import type { AggregatedVideo } from "@/lib/insights/aggregate";

export function EngagementPanel({ videos }: { videos: AggregatedVideo[] }) {
  if (videos.length === 0) return null;

  const likeRates = videos
    .map((v) => v.engagement.likeRate)
    .filter((x): x is number => x !== null);
  const commentRates = videos
    .map((v) => v.engagement.commentRate)
    .filter((x): x is number => x !== null);
  const viralScores = videos
    .map((v) => v.engagement.viralScore)
    .filter((x): x is number => x !== null);

  const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const median = (a: number[]) => {
    if (a.length === 0) return 0;
    const sorted = [...a].sort((x, y) => x - y);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        エンゲージメント拡張 KPI
      </h3>
      <div className="grid gap-4 md:grid-cols-3">
        <Cell
          label="平均高評価率"
          avg={avg(likeRates)}
          median={median(likeRates)}
          color="text-lime-400"
        />
        <Cell
          label="平均コメント率"
          avg={avg(commentRates)}
          median={median(commentRates)}
          color="text-cyan-400"
        />
        <Cell
          label="平均バイラル係数"
          avg={avg(viralScores)}
          median={median(viralScores)}
          color="text-amber-400"
        />
      </div>
    </div>
  );
}

function Cell({
  label,
  avg,
  median,
  color,
}: {
  label: string;
  avg: number;
  median: number;
  color: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 font-mono text-lg tabular-nums ${color}`}>
        {avg.toFixed(2)}
      </p>
      <p className="text-[10px] text-muted-foreground">中央値 {median.toFixed(2)}</p>
    </div>
  );
}
