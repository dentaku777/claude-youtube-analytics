"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
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
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_VISIBLE_COLUMNS,
  type PageSize,
  type VideoColumnId,
} from "@/lib/preference/columns";

type SortKey =
  | "publishedAt"
  | "viewCount"
  | "likeCount"
  | "commentCount"
  | "spreadRate"
  | "durationSec";

type SortDir = "asc" | "desc";

// 各列の幅 (Tailwind 用)
const COLUMN_WIDTH: Record<VideoColumnId, string> = {
  thumbnail: "w-[80px]",
  title: "",
  publishedAt: "w-[100px]",
  duration: "w-[80px]",
  type: "w-[60px]",
  views: "w-[100px]",
  likes: "w-[80px]",
  comments: "w-[80px]",
  spread: "w-[100px]",
  link: "w-[40px]",
};

// ソート可能列の対応関係
const SORT_KEY_OF: Partial<Record<VideoColumnId, SortKey>> = {
  publishedAt: "publishedAt",
  duration: "durationSec",
  views: "viewCount",
  likes: "likeCount",
  comments: "commentCount",
  spread: "spreadRate",
};

export interface VideoTableProps {
  videos: VideoWithKpi[];
  visibleColumns?: VideoColumnId[];
  pageSize?: PageSize;
}

export function VideoTable({
  videos,
  visibleColumns = DEFAULT_VISIBLE_COLUMNS,
  pageSize = DEFAULT_PAGE_SIZE,
}: VideoTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("publishedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  // sort or pageSize 変化時は 1 ページ目に戻す
  useEffect(() => {
    setPage(1);
  }, [sortKey, sortDir, pageSize, videos.length]);

  // 表示する列の集合 (Set ルックアップ用)
  const visibleSet = useMemo(
    () => new Set<VideoColumnId>(visibleColumns),
    [visibleColumns],
  );
  const show = (id: VideoColumnId) => visibleSet.has(id);

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

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(startIdx, startIdx + pageSize);

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
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              {show("thumbnail") && (
                <TableHead className={COLUMN_WIDTH.thumbnail}>サムネ</TableHead>
              )}
              {show("title") && <TableHead>タイトル</TableHead>}
              {show("publishedAt") && (
                <SortHead
                  width={COLUMN_WIDTH.publishedAt}
                  active={sortKey === SORT_KEY_OF.publishedAt}
                  dir={sortDir}
                  onClick={() => toggleSort(SORT_KEY_OF.publishedAt!)}
                >
                  公開日
                </SortHead>
              )}
              {show("duration") && (
                <SortHead
                  width={COLUMN_WIDTH.duration}
                  align="right"
                  active={sortKey === SORT_KEY_OF.duration}
                  dir={sortDir}
                  onClick={() => toggleSort(SORT_KEY_OF.duration!)}
                >
                  長さ
                </SortHead>
              )}
              {show("type") && (
                <TableHead className={COLUMN_WIDTH.type}>タイプ</TableHead>
              )}
              {show("views") && (
                <SortHead
                  width={COLUMN_WIDTH.views}
                  align="right"
                  active={sortKey === SORT_KEY_OF.views}
                  dir={sortDir}
                  onClick={() => toggleSort(SORT_KEY_OF.views!)}
                >
                  再生数
                </SortHead>
              )}
              {show("likes") && (
                <SortHead
                  width={COLUMN_WIDTH.likes}
                  align="right"
                  active={sortKey === SORT_KEY_OF.likes}
                  dir={sortDir}
                  onClick={() => toggleSort(SORT_KEY_OF.likes!)}
                >
                  高評価
                </SortHead>
              )}
              {show("comments") && (
                <SortHead
                  width={COLUMN_WIDTH.comments}
                  align="right"
                  active={sortKey === SORT_KEY_OF.comments}
                  dir={sortDir}
                  onClick={() => toggleSort(SORT_KEY_OF.comments!)}
                >
                  コメント
                </SortHead>
              )}
              {show("spread") && (
                <SortHead
                  width={COLUMN_WIDTH.spread}
                  align="right"
                  active={sortKey === SORT_KEY_OF.spread}
                  dir={sortDir}
                  onClick={() => toggleSort(SORT_KEY_OF.spread!)}
                >
                  伸び率
                </SortHead>
              )}
              {show("link") && (
                <TableHead className={COLUMN_WIDTH.link} />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((v) => (
              <TableRow
                key={v.videoId}
                className="border-zinc-800 hover:bg-zinc-900/40"
              >
                {show("thumbnail") && (
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
                )}
                {show("title") && (
                  <TableCell className="max-w-md">
                    <p className="line-clamp-2 text-sm" title={v.title}>
                      {v.title}
                    </p>
                  </TableCell>
                )}
                {show("publishedAt") && (
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {formatDate(v.publishedAt)}
                  </TableCell>
                )}
                {show("duration") && (
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {formatDuration(v.durationSec)}
                  </TableCell>
                )}
                {show("type") && (
                  <TableCell>
                    {v.isShort ? (
                      <Badge
                        variant="outline"
                        className="border-cyan-500/30 text-cyan-400"
                      >
                        Shorts
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">通常</span>
                    )}
                  </TableCell>
                )}
                {show("views") && (
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatNumber(v.viewCount)}
                  </TableCell>
                )}
                {show("likes") && (
                  <TableCell className="text-right font-mono text-muted-foreground tabular-nums">
                    {formatNumber(v.likeCount)}
                  </TableCell>
                )}
                {show("comments") && (
                  <TableCell className="text-right font-mono text-muted-foreground tabular-nums">
                    {formatNumber(v.commentCount)}
                  </TableCell>
                )}
                {show("spread") && (
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
                )}
                {show("link") && (
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
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={sorted.length}
        pageSize={pageSize}
        onChange={setPage}
      />
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
      <SortButton active={active} dir={dir} onClick={onClick}>
        {children}
      </SortButton>
    </TableHead>
  );
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
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return (
      <p className="text-right text-xs text-muted-foreground">
        全 <span className="font-mono text-foreground">{totalCount}</span> 件
      </p>
    );
  }
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);
  return (
    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
      <span>
        <span className="font-mono text-foreground">{from}</span>
        {" – "}
        <span className="font-mono text-foreground">{to}</span>
        {" / "}
        <span className="font-mono text-foreground">{totalCount}</span> 件
      </span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={() => onChange(currentPage - 1)}
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
          onClick={() => onChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
