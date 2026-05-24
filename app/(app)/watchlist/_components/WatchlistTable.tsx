"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, RefreshCw, Trash2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber, compactNumber } from "@/lib/format";
import {
  refreshWatchlistChannel,
  removeFromWatchlist,
} from "@/app/_actions/watchlist";

export interface WatchlistRow {
  id: string;
  channelId: string;
  channelTitle: string;
  channelHandle: string | null;
  thumbnailUrl: string | null;
  tags: string[];
  memo: string | null;
  addedAt: Date;
  lastAnalyzedAt: Date | null;
  // キャッシュからの集計値 (任意)
  subscriberCount?: number | null;
  videoCount?: number | null;
  avgSpreadRate?: number | null;
}

type SortKey =
  | "addedAt"
  | "channelTitle"
  | "subscriberCount"
  | "videoCount"
  | "avgSpreadRate";
type SortDir = "asc" | "desc";

export function WatchlistTable({
  rows,
  onEdit,
}: {
  rows: WatchlistRow[];
  onEdit: (row: WatchlistRow) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("addedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sorted = useMemo(() => {
    const copy = [...rows];
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
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = Number(av);
      const bn = Number(bv);
      return sortDir === "asc" ? an - bn : bn - an;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function handleRefresh(row: WatchlistRow) {
    setPendingId(row.id);
    startTransition(async () => {
      const result = await refreshWatchlistChannel({
        channelId: row.channelId,
      });
      setPendingId(null);
      if (result.ok) toast.success(`${row.channelTitle} を更新しました`);
      else toast.error(result.message ?? "更新に失敗しました");
    });
  }

  function handleRemove(row: WatchlistRow) {
    if (!confirm(`${row.channelTitle} を Watchlist から削除しますか？`)) return;
    setPendingId(row.id);
    startTransition(async () => {
      const result = await removeFromWatchlist({ channelId: row.channelId });
      setPendingId(null);
      if (result.ok) toast.success(`${row.channelTitle} を削除しました`);
      else toast.error(result.message ?? "削除に失敗しました");
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center">
        <Star className="mx-auto h-10 w-10 text-zinc-700" />
        <p className="mt-3 text-sm text-foreground">
          Watchlist にチャンネルがありません
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          上のフォームから、または分析画面の「★ Watchlist に追加」から追加できます。
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-xs text-muted-foreground">
            <SortHead onClick={() => toggleSort("channelTitle")} active={sortKey === "channelTitle"} dir={sortDir}>
              チャンネル
            </SortHead>
            <th className="px-3 py-2 text-left">タグ</th>
            <SortHead
              onClick={() => toggleSort("subscriberCount")}
              active={sortKey === "subscriberCount"}
              dir={sortDir}
              align="right"
            >
              登録者
            </SortHead>
            <SortHead
              onClick={() => toggleSort("videoCount")}
              active={sortKey === "videoCount"}
              dir={sortDir}
              align="right"
            >
              動画数
            </SortHead>
            <SortHead
              onClick={() => toggleSort("avgSpreadRate")}
              active={sortKey === "avgSpreadRate"}
              dir={sortDir}
              align="right"
            >
              平均伸び率
            </SortHead>
            <SortHead
              onClick={() => toggleSort("addedAt")}
              active={sortKey === "addedAt"}
              dir={sortDir}
            >
              最終分析
            </SortHead>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.id}
              className="border-b border-zinc-900 hover:bg-zinc-900/40"
            >
              <td className="px-3 py-2">
                <Link
                  href={`/search?input=${encodeURIComponent(row.channelHandle ? `@${row.channelHandle.replace(/^@/, "")}` : row.channelId)}`}
                  className="flex items-center gap-3"
                >
                  {row.thumbnailUrl ? (
                    <Image
                      src={row.thumbnailUrl}
                      alt={row.channelTitle}
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 rounded-full border border-zinc-800"
                    />
                  ) : (
                    <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-800" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground hover:text-lime-400">
                      {row.channelTitle}
                    </p>
                    {row.channelHandle && (
                      <p className="truncate font-mono text-[10px] text-muted-foreground">
                        @{row.channelHandle.replace(/^@/, "")}
                      </p>
                    )}
                  </div>
                </Link>
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {row.tags.length > 0 ? (
                    row.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">
                        {t}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-700">-</span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">
                {row.subscriberCount !== undefined && row.subscriberCount !== null
                  ? compactNumber(row.subscriberCount)
                  : "-"}
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">
                {row.videoCount !== undefined && row.videoCount !== null
                  ? formatNumber(row.videoCount)
                  : "-"}
              </td>
              <td className={cn(
                "px-3 py-2 text-right font-mono font-semibold tabular-nums",
                row.avgSpreadRate !== null && row.avgSpreadRate !== undefined && row.avgSpreadRate >= 100 && "text-lime-400",
                row.avgSpreadRate !== null && row.avgSpreadRate !== undefined && row.avgSpreadRate >= 30 && row.avgSpreadRate < 100 && "text-amber-400",
              )}>
                {row.avgSpreadRate !== undefined && row.avgSpreadRate !== null
                  ? `${row.avgSpreadRate.toFixed(2)}%`
                  : "-"}
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                {row.lastAnalyzedAt ? formatDate(row.lastAnalyzedAt) : "-"}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onEdit(row)}
                    title="タグ・メモを編集"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleRefresh(row)}
                    disabled={pendingId === row.id}
                    title="再分析"
                  >
                    {pendingId === row.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => handleRemove(row)}
                    disabled={pendingId === row.id}
                    title="削除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getValue(r: WatchlistRow, key: SortKey): number | Date | string | null {
  switch (key) {
    case "addedAt":
      return r.lastAnalyzedAt ?? r.addedAt;
    case "channelTitle":
      return r.channelTitle;
    case "subscriberCount":
      return r.subscriberCount ?? null;
    case "videoCount":
      return r.videoCount ?? null;
    case "avgSpreadRate":
      return r.avgSpreadRate ?? null;
  }
}

function SortHead({
  onClick,
  active,
  dir,
  align = "left",
  children,
}: {
  onClick: () => void;
  active: boolean;
  dir: SortDir;
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <th className={cn("px-3 py-2", align === "right" && "text-right")}>
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
        {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
      </button>
    </th>
  );
}
