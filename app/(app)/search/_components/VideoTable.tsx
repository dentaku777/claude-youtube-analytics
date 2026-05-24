"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VideoWithKpi } from "@/lib/youtube/kpi/video";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import { formatDuration } from "@/lib/youtube/kpi/duration";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type SortKey =
  | "publishedAt"
  | "viewCount"
  | "likeCount"
  | "commentCount"
  | "spreadRate"
  | "durationSec";

type SortDir = "asc" | "desc";

export function VideoTable({ videos }: { videos: VideoWithKpi[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("publishedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...videos];
    copy.sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);
      // null は常に末尾
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (av instanceof Date && bv instanceof Date) {
        return sortDir === "asc"
          ? av.getTime() - bv.getTime()
          : bv.getTime() - av.getTime();
      }
      const an = Number(av);
      const bn = Number(bv);
      return sortDir === "asc" ? an - bn : bn - an;
    });
    return copy;
  }, [videos, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-sm text-muted-foreground">
        条件に該当する動画がありません
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="w-[80px]">サムネ</TableHead>
            <TableHead>タイトル</TableHead>
            <TableHead className="w-[100px]">
              <SortButton
                active={sortKey === "publishedAt"}
                dir={sortDir}
                onClick={() => toggleSort("publishedAt")}
              >
                公開日
              </SortButton>
            </TableHead>
            <TableHead className="w-[80px] text-right">
              <SortButton
                active={sortKey === "durationSec"}
                dir={sortDir}
                onClick={() => toggleSort("durationSec")}
              >
                長さ
              </SortButton>
            </TableHead>
            <TableHead className="w-[60px]">タイプ</TableHead>
            <TableHead className="w-[100px] text-right">
              <SortButton
                active={sortKey === "viewCount"}
                dir={sortDir}
                onClick={() => toggleSort("viewCount")}
              >
                再生数
              </SortButton>
            </TableHead>
            <TableHead className="w-[80px] text-right">
              <SortButton
                active={sortKey === "likeCount"}
                dir={sortDir}
                onClick={() => toggleSort("likeCount")}
              >
                高評価
              </SortButton>
            </TableHead>
            <TableHead className="w-[80px] text-right">
              <SortButton
                active={sortKey === "commentCount"}
                dir={sortDir}
                onClick={() => toggleSort("commentCount")}
              >
                コメント
              </SortButton>
            </TableHead>
            <TableHead className="w-[100px] text-right">
              <SortButton
                active={sortKey === "spreadRate"}
                dir={sortDir}
                onClick={() => toggleSort("spreadRate")}
              >
                伸び率
              </SortButton>
            </TableHead>
            <TableHead className="w-[40px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((v) => (
            <TableRow key={v.videoId} className="border-zinc-800 hover:bg-zinc-900/40">
              <TableCell>
                {v.thumbnailUrl ? (
                  <Image
                    src={v.thumbnailUrl}
                    alt={v.title}
                    width={80}
                    height={45}
                    className="h-[45px] w-20 rounded object-cover"
                  />
                ) : (
                  <div className="h-[45px] w-20 rounded bg-zinc-800" />
                )}
              </TableCell>
              <TableCell className="max-w-md">
                <p className="line-clamp-2 text-sm" title={v.title}>
                  {v.title}
                </p>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground tabular-nums">
                {formatDate(v.publishedAt)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs tabular-nums">
                {formatDuration(v.durationSec)}
              </TableCell>
              <TableCell>
                {v.isShort ? (
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                    Shorts
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">通常</span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatNumber(v.viewCount)}
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground tabular-nums">
                {formatNumber(v.likeCount)}
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground tabular-nums">
                {formatNumber(v.commentCount)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono font-semibold tabular-nums",
                  v.spreadCategory === "win" && "text-lime-400",
                  v.spreadCategory === "healthy" && "text-amber-400",
                  v.spreadCategory === "low" && "text-zinc-500",
                )}
              >
                {formatPercent(v.spreadRate)}
              </TableCell>
              <TableCell>
                <a
                  href={`https://www.youtube.com/watch?v=${v.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-foreground"
                  aria-label="YouTube で開く"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getValue(v: VideoWithKpi, key: SortKey): number | Date | null {
  switch (key) {
    case "publishedAt":
      return v.publishedAt;
    case "viewCount":
      return v.viewCount;
    case "likeCount":
      return v.likeCount;
    case "commentCount":
      return v.commentCount;
    case "spreadRate":
      return v.spreadRate;
    case "durationSec":
      return v.durationSec;
  }
}

function SortButton({
  active,
  dir,
  onClick,
  children,
}: {
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-xs transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {active ? (
        dir === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  );
}
