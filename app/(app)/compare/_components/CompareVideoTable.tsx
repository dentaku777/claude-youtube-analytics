"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { COMPARE_COLORS } from "./CompareTrendLines";

export interface CompareVideoEntry extends VideoWithKpi {
  channelIndex: number; // 0..2
  channelTitle: string;
}

type SortKey = "publishedAt" | "viewCount" | "spreadRate" | "durationSec";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

export function CompareVideoTable({ videos }: { videos: CompareVideoEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("spreadRate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const copy = [...videos];
    copy.sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);
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

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
        該当する動画がありません
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-[120px]">チャンネル</TableHead>
              <TableHead className="w-[160px]">サムネ</TableHead>
              <TableHead>タイトル</TableHead>
              <SortHead
                width="w-[100px]"
                active={sortKey === "publishedAt"}
                dir={sortDir}
                onClick={() => toggleSort("publishedAt")}
              >
                公開日
              </SortHead>
              <SortHead
                width="w-[80px]"
                align="right"
                active={sortKey === "durationSec"}
                dir={sortDir}
                onClick={() => toggleSort("durationSec")}
              >
                長さ
              </SortHead>
              <SortHead
                width="w-[100px]"
                align="right"
                active={sortKey === "viewCount"}
                dir={sortDir}
                onClick={() => toggleSort("viewCount")}
              >
                再生数
              </SortHead>
              <SortHead
                width="w-[100px]"
                align="right"
                active={sortKey === "spreadRate"}
                dir={sortDir}
                onClick={() => toggleSort("spreadRate")}
              >
                伸び率
              </SortHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((v) => (
              <TableRow
                key={`${v.channelIndex}-${v.videoId}`}
                className="border-zinc-800 hover:bg-zinc-900/40"
              >
                <TableCell>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: COMPARE_COLORS[v.channelIndex],
                      color: COMPARE_COLORS[v.channelIndex],
                    }}
                    className="max-w-[110px] truncate"
                    title={v.channelTitle}
                  >
                    {v.channelTitle}
                  </Badge>
                </TableCell>
                <TableCell>
                  <a
                    href={`https://www.youtube.com/watch?v=${v.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block transition-opacity hover:opacity-80"
                  >
                    {v.thumbnailUrl ? (
                      <Image
                        src={v.thumbnailUrl}
                        alt={v.title}
                        width={160}
                        height={90}
                        className="h-[90px] w-[160px] rounded object-cover"
                      />
                    ) : (
                      <div className="h-[90px] w-[160px] rounded bg-zinc-800" />
                    )}
                  </a>
                </TableCell>
                <TableCell className="max-w-md">
                  <a
                    href={`https://www.youtube.com/watch?v=${v.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="line-clamp-2 text-sm text-foreground transition-colors hover:text-lime-400 hover:underline"
                    title={v.title}
                  >
                    {v.title}
                  </a>
                  {v.hashtags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                      {v.hashtags.slice(0, 5).map((tag) => (
                        <span key={tag} className="text-xs text-cyan-400/80">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {formatDate(v.publishedAt)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums">
                  {formatDuration(v.durationSec)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatNumber(v.viewCount)}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            <span className="font-mono text-foreground">
              {(currentPage - 1) * PAGE_SIZE + 1}
            </span>
            {" – "}
            <span className="font-mono text-foreground">
              {Math.min(currentPage * PAGE_SIZE, sorted.length)}
            </span>
            {" / "}
            <span className="font-mono text-foreground">{sorted.length}</span> 件
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 font-mono text-xs">
              {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getValue(v: CompareVideoEntry, key: SortKey): number | Date | null {
  switch (key) {
    case "publishedAt":
      return v.publishedAt;
    case "viewCount":
      return v.viewCount;
    case "spreadRate":
      return v.spreadRate;
    case "durationSec":
      return v.durationSec;
  }
}

function SortHead({
  width,
  align = "left",
  active,
  dir,
  onClick,
  children,
}: {
  width: string;
  align?: "left" | "right";
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <TableHead className={cn(width, align === "right" && "text-right")}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 text-xs transition-colors",
          active
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
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
    </TableHead>
  );
}
