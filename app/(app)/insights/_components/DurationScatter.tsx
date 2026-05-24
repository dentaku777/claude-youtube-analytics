"use client";

import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AggregatedVideo } from "@/lib/insights/aggregate";
import { compactNumber } from "@/lib/format";
import { formatDuration } from "@/lib/youtube/kpi/duration";

export function DurationScatter({ videos }: { videos: AggregatedVideo[] }) {
  const shorts = videos
    .filter((v) => v.isShort && v.spreadRate !== null)
    .map((v) => ({ x: v.durationSec, y: v.spreadRate as number, title: v.title }));
  const regular = videos
    .filter((v) => !v.isShort && v.spreadRate !== null)
    .map((v) => ({ x: v.durationSec, y: v.spreadRate as number, title: v.title }));

  if (shorts.length === 0 && regular.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        動画尺 × 伸び率 散布図
      </h3>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="動画尺"
              stroke="#71717a"
              tick={{ fontSize: 11, fontFamily: "monospace" }}
              tickFormatter={(v) => formatDuration(Number(v))}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="伸び率"
              stroke="#71717a"
              tick={{ fontSize: 11, fontFamily: "monospace" }}
              tickFormatter={(v) => `${v}%`}
              width={48}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                fontSize: 12,
                borderRadius: 6,
              }}
              formatter={(value, name) => {
                if (name === "動画尺") return [formatDuration(Number(value)), name];
                if (name === "伸び率") return [`${Number(value).toFixed(1)}%`, name];
                return [compactNumber(Number(value)), name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Scatter
              name="Shorts"
              data={shorts}
              fill="#22d3ee"
              fillOpacity={0.7}
            />
            <Scatter
              name="通常動画"
              data={regular}
              fill="#a3e635"
              fillOpacity={0.7}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
