"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyTrendPoint } from "@/lib/youtube/kpi/trend";
import { compactNumber } from "@/lib/format";

export function TrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          過去 12 ヶ月の推移
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-lime-400/70" />
            投稿本数
          </span>
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-3 bg-cyan-400" />
            総再生数
          </span>
        </div>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
          >
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="yearMonth"
              stroke="#71717a"
              tick={{ fontSize: 11, fontFamily: "monospace" }}
              tickFormatter={(v: string) => v.slice(5) /* MM */}
            />
            <YAxis
              yAxisId="left"
              stroke="#a3e635"
              tick={{ fontSize: 11, fontFamily: "monospace" }}
              allowDecimals={false}
              width={36}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#22d3ee"
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
              formatter={(value, name) => {
                const num = Number(value ?? 0);
                if (name === "投稿本数") return [num, name];
                return [compactNumber(num), name];
              }}
            />
            <Legend wrapperStyle={{ display: "none" }} />
            <Bar
              yAxisId="left"
              dataKey="postCount"
              name="投稿本数"
              fill="#a3e635"
              fillOpacity={0.7}
              radius={[3, 3, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="totalViews"
              name="総再生数"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ r: 3, fill: "#22d3ee" }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
