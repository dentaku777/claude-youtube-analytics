import Image from "next/image";
import type { AggregatedVideo } from "@/lib/insights/aggregate";
import { compactNumber, formatPercent } from "@/lib/format";

export function ThumbnailGallery({ videos }: { videos: AggregatedVideo[] }) {
  // 伸び率上位 100 件
  const top = [...videos]
    .filter((v) => v.spreadRate !== null)
    .sort((a, b) => (b.spreadRate ?? 0) - (a.spreadRate ?? 0))
    .slice(0, 100);

  if (top.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-sm text-muted-foreground">
        対象動画がありません
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        サムネギャラリー (伸び率上位 {top.length} 件)
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {top.map((v) => (
          <a
            key={`${v.channelId}-${v.videoId}`}
            href={`https://www.youtube.com/watch?v=${v.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block overflow-hidden rounded-lg border border-zinc-800 transition-colors hover:border-lime-400/40"
          >
            <div className="relative aspect-video bg-zinc-900">
              {v.thumbnailUrl && (
                <Image
                  src={v.thumbnailUrl}
                  alt={v.title}
                  fill
                  className="object-cover transition-opacity group-hover:opacity-80"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
              )}
              <span className="absolute right-1 top-1 rounded bg-lime-400/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-950">
                {formatPercent(v.spreadRate)}
              </span>
            </div>
            <div className="p-2">
              <p
                className="line-clamp-2 text-xs text-foreground"
                title={v.title}
              >
                {v.title}
              </p>
              <p className="mt-1 truncate text-[10px] text-muted-foreground">
                {v.channelTitle} · {compactNumber(v.viewCount)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
