"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { HeatmapResult } from "@/lib/insights/heatmap";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function PostingHeatmap({ data }: { data: HeatmapResult }) {
  const [mode, setMode] = useState<"count" | "spread">("count");

  function colorFor(value: number, max: number) {
    if (max === 0 || value === 0) return "#27272a"; // zinc-800
    const ratio = Math.min(1, value / max);
    if (ratio < 0.2) return "#365314"; // lime-900
    if (ratio < 0.4) return "#65a30d"; // lime-600
    if (ratio < 0.7) return "#a3e635"; // lime-400
    return "#ecfccb"; // lime-100
  }

  const max = mode === "count" ? data.maxPostCount : data.maxAvgSpread;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          投稿時間ヒートマップ (JST)
        </h3>
        <div className="flex items-center gap-1 rounded-md border border-zinc-800 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("count")}
            className={cn(
              "rounded px-2 py-0.5 transition-colors",
              mode === "count"
                ? "bg-zinc-800 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            投稿数
          </button>
          <button
            type="button"
            onClick={() => setMode("spread")}
            className={cn(
              "rounded px-2 py-0.5 transition-colors",
              mode === "spread"
                ? "bg-zinc-800 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            平均伸び率
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hour labels (top) */}
          <div className="flex gap-px pl-8">
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="w-4 text-center font-mono text-[9px] text-muted-foreground"
              >
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
          </div>
          {/* Rows */}
          {DAY_LABELS.map((label, day) => (
            <div key={day} className="flex items-center gap-px">
              <div className="w-8 pr-2 text-right font-mono text-[10px] text-muted-foreground">
                {label}
              </div>
              {Array.from({ length: 24 }, (_, hour) => {
                const cell = data.cells.find(
                  (c) => c.day === day && c.hour === hour,
                )!;
                const value = mode === "count" ? cell.postCount : cell.avgSpread ?? 0;
                return (
                  <div
                    key={hour}
                    title={`${label} ${hour}:00\n投稿: ${cell.postCount}\n平均伸び率: ${cell.avgSpread !== null ? cell.avgSpread.toFixed(1) + "%" : "-"}`}
                    className="h-4 w-4 rounded-sm transition-transform hover:scale-150 hover:z-10 hover:ring-1 hover:ring-lime-400"
                    style={{ backgroundColor: colorFor(value, max) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground">
        マスにカーソルで詳細表示。色が濃いほど {mode === "count" ? "投稿数" : "平均伸び率"} が大きい。
      </p>
    </div>
  );
}
