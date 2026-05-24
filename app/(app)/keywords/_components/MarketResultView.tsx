"use client";

import Image from "next/image";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MarketResearchResult } from "@/lib/keywords/market-research";
import { compactNumber, formatNumber, formatPercent } from "@/lib/format";
import { AddToWatchlistButton } from "@/components/watchlist/AddToWatchlistButton";

export function MarketResultView({ result }: { result: MarketResearchResult }) {
  return (
    <div className="space-y-6">
      {/* 概要 KPI */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          「{result.keyword}」の市場サマリ
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Stat label="動画件数" value={formatNumber(result.totalVideos)} />
          <Stat
            label="チャンネル数"
            value={formatNumber(result.channelCount)}
          />
          <Stat label="総再生数" value={compactNumber(result.totalViews)} />
          <Stat label="平均再生数" value={compactNumber(result.avgViews)} />
        </div>
      </div>

      {/* 伸び率分布 */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          伸び率分布
        </h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={result.histogram}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="bucket"
                stroke="#71717a"
                tick={{ fontSize: 11, fontFamily: "monospace" }}
              />
              <YAxis
                stroke="#71717a"
                tick={{ fontSize: 11, fontFamily: "monospace" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  fontSize: 12,
                  borderRadius: 6,
                }}
              />
              <Bar dataKey="count" fill="#a3e635" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 上位チャンネル */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          動画数上位チャンネル ({result.topChannels.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-muted-foreground">
                <th className="px-3 py-2 text-left">チャンネル</th>
                <th className="px-3 py-2 text-right">登録者</th>
                <th className="px-3 py-2 text-right">該当本数</th>
                <th className="px-3 py-2 text-right">平均再生数</th>
                <th className="px-3 py-2 text-right">平均伸び率</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {result.topChannels.map((ch) => (
                <tr key={ch.channelId} className="border-b border-zinc-900">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {ch.thumbnailUrl ? (
                        <Image
                          src={ch.thumbnailUrl}
                          alt={ch.channelTitle}
                          width={28}
                          height={28}
                          className="h-7 w-7 rounded-full border border-zinc-800"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-zinc-800" />
                      )}
                      <a
                        href={`https://www.youtube.com/channel/${ch.channelId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-lime-400"
                      >
                        {ch.channelTitle}
                      </a>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {ch.subscriberCount !== null
                      ? compactNumber(ch.subscriberCount)
                      : "非公開"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {ch.videoCount}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {compactNumber(ch.avgViews)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-lime-400">
                    {formatPercent(ch.avgSpreadRate)}
                  </td>
                  <td className="px-3 py-2">
                    <AddToWatchlistButton
                      channelInput={ch.channelId}
                      channelTitle={ch.channelTitle}
                      variant="compact"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 当キーワードの取得動画一覧 (上位 20) */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          サンプル動画 (伸び率順 上位 20)
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[...result.videos]
            .filter((v) => v.spreadRate !== null)
            .sort((a, b) => (b.spreadRate ?? 0) - (a.spreadRate ?? 0))
            .slice(0, 20)
            .map((v) => (
              <a
                key={v.videoId}
                href={`https://www.youtube.com/watch?v=${v.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-lg border border-zinc-800 transition-colors hover:border-lime-400/40"
              >
                <div className="relative aspect-video bg-zinc-900">
                  {v.thumbnailUrl && (
                    <Image
                      src={v.thumbnailUrl}
                      alt={v.title}
                      fill
                      className="object-cover transition-opacity group-hover:opacity-80"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  )}
                  <span className="absolute right-1 top-1 rounded bg-lime-400/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-950">
                    {formatPercent(v.spreadRate)}
                  </span>
                </div>
                <div className="p-2">
                  <p className="line-clamp-2 text-xs">{v.title}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">
                    {v.channelTitle} · {compactNumber(v.viewCount)}
                  </p>
                </div>
              </a>
            ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}
