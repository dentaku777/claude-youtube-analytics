"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendGranularity, TrendPoint } from "@/lib/youtube/kpi/trend";
import { compactNumber } from "@/lib/format";

// 3 チャンネル分の識別カラー (F-COMPARE-06)
export const COMPARE_COLORS = ["#a3e635", "#22d3ee", "#f59e0b"] as const;

export interface CompareSeries {
  label: string; // チャンネル名
  trend: TrendPoint[];
}

export interface CompareTrendLinesProps {
  series: CompareSeries[];
  granularity: TrendGranularity;
  title: string;
}

export function CompareTrendLines({
  series,
  granularity,
  title,
}: CompareTrendLinesProps) {
  // 全シリーズのバケットを union して時間順に並べる (各シリーズで期間が違う可能性に備える)
  const bucketSet = new Set<string>();
  for (const s of series) {
    for (const p of s.trend) bucketSet.add(p.bucket);
  }
  const buckets = Array.from(bucketSet).sort();

  // バケットごとに各シリーズの値を merge
  const merged = buckets.map((b) => {
    const row: Record<string, number | string> = { bucket: b };
    series.forEach((s, i) => {
      const point = s.trend.find((p) => p.bucket === b);
      row[`series_${i}`] = point ? point.totalViews : 0;
    });
    return row;
  });

  const tickFormat = (v: string) =>
    granularity === "month" ? v.slice(5) : v.slice(5);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {title}の総再生数比較
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {series.map((s, i) => (
            <span key={i} className="flex items-center gap-1">
              <span
                className="h-0.5 w-3"
                style={{ backgroundColor: COMPARE_COLORS[i] }}
              />
              <span className="max-w-[120px] truncate">{s.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={merged}
            margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              stroke="#27272a"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="bucket"
              stroke="#71717a"
              tick={{ fontSize: 11, fontFamily: "monospace" }}
              tickFormatter={tickFormat}
              minTickGap={granularity === "day" ? 16 : 4}
            />
            <YAxis
              stroke="#71717a"
              tick={{ fontSize: 11, fontFamily: "monospace" }}
              tickFormatter={(v) => compactNumber(v)}
              width={48}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                fontSize: 12,
                borderRadius: 6,
              }}
              labelStyle={{ color: "#fafafa" }}
              formatter={(value, _name, item) => {
                const idx = Number(
                  String(item.dataKey ?? "").replace("series_", ""),
                );
                const label = series[idx]?.label ?? "?";
                return [compactNumber(Number(value ?? 0)), label];
              }}
            />
            <Legend wrapperStyle={{ display: "none" }} />
            {series.map((_, i) => (
              <Line
                key={i}
                type="linear"
                dataKey={`series_${i}`}
                stroke={COMPARE_COLORS[i]}
                strokeWidth={2}
                dot={{ r: 3, fill: COMPARE_COLORS[i] }}
                activeDot={{ r: 5 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
