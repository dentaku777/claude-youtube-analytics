import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  ArrowLeftRight,
  Globe,
  Compass,
  History as HistoryIcon,
} from "lucide-react";
import { SearchType } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "History" };

const TYPE_META: Record<
  string,
  { label: string; icon: typeof Search; color: string }
> = {
  SEARCH: { label: "単一分析", icon: Search, color: "text-lime-400" },
  COMPARE: { label: "比較", icon: ArrowLeftRight, color: "text-cyan-400" },
  KEYWORD: { label: "キーワード", icon: Globe, color: "text-amber-400" },
  DISCOVER: { label: "競合発見", icon: Compass, color: "text-violet-400" },
};

interface HistoryRow {
  id: string;
  type: SearchType;
  createdAt: Date;
  title: string;
  detail: string;
  link: string | null; // 再実行 URL
}

export default async function HistoryPage() {
  const user = await requireUser();

  // 検索系履歴 + キーワード履歴を統合
  const [history, keywordResearch] = await Promise.all([
    prisma.searchHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.keywordResearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const rows: HistoryRow[] = [
    ...history.map((h) => toRow(h)),
    ...keywordResearch.map((k) => ({
      id: `kw-${k.id}`,
      type: SearchType.KEYWORD,
      createdAt: k.createdAt,
      title: `「${k.keyword}」`,
      detail: `${k.channelCount} ch / 総再生 ${k.totalViews.toString()}`,
      link: `/keywords`,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">検索履歴</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          直近 100 件まで表示。クリックで再実行できます。
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center">
          <HistoryIcon className="mx-auto h-10 w-10 text-zinc-700" />
          <p className="mt-3 text-sm text-foreground">履歴がありません</p>
          <p className="mt-1 text-xs text-muted-foreground">
            /search / /compare / /keywords / /discover を使うとここに記録されます。
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-muted-foreground">
                <th className="px-3 py-2 text-left">種別</th>
                <th className="px-3 py-2 text-left">対象</th>
                <th className="px-3 py-2 text-left">詳細</th>
                <th className="px-3 py-2 text-left">日時</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = TYPE_META[row.type];
                const Icon = meta.icon;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-900 hover:bg-zinc-900/40"
                  >
                    <td className="px-3 py-2">
                      <Badge variant="outline" className={`gap-1 ${meta.color}`}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 max-w-[300px] truncate">{row.title}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {row.detail}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                      {formatRelative(row.createdAt)}
                      <span className="ml-2 text-zinc-700">
                        ({formatDate(row.createdAt)})
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {row.link && (
                        <Button asChild variant="ghost" size="sm" className="h-7">
                          <Link href={row.link}>再実行</Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function toRow(h: {
  id: string;
  type: SearchType;
  createdAt: Date;
  channels: unknown;
  keyword: string | null;
  period: string | null;
  filters: unknown;
  resultMeta: unknown;
}): HistoryRow {
  const channels = (h.channels ?? []) as Array<{
    channelId?: string;
    title?: string;
    input?: string;
  }>;
  const filters = (h.filters ?? {}) as { videoType?: string };
  const meta = (h.resultMeta ?? {}) as {
    videoCount?: number;
    totalQuotaSpent?: number;
    candidateCount?: number;
    quotaSpent?: number;
  };

  switch (h.type) {
    case SearchType.SEARCH: {
      const ch = channels[0];
      return {
        id: h.id,
        type: h.type,
        createdAt: h.createdAt,
        title: ch?.title ?? ch?.channelId ?? "?",
        detail: `${h.period ?? "?"} / ${filters.videoType ?? "all"} / ${meta.videoCount ?? "-"} 本`,
        link: ch?.channelId
          ? `/search?input=${encodeURIComponent(ch.channelId)}&period=${h.period ?? "3m"}&type=${filters.videoType ?? "all"}`
          : null,
      };
    }
    case SearchType.COMPARE: {
      const titles = channels
        .map((c) => c.title ?? c.input ?? "?")
        .filter(Boolean);
      const inputs = channels
        .map((c) => c.channelId ?? c.input ?? "")
        .filter(Boolean);
      return {
        id: h.id,
        type: h.type,
        createdAt: h.createdAt,
        title: titles.join(" / "),
        detail: `${h.period ?? "?"} / 成功 ${meta.totalQuotaSpent !== undefined ? "(Quota " + meta.totalQuotaSpent + ")" : ""}`,
        link:
          inputs.length > 0
            ? `/compare?inputs=${encodeURIComponent(inputs.join(","))}&period=${h.period ?? "3m"}`
            : null,
      };
    }
    case SearchType.DISCOVER: {
      const ch = channels[0];
      return {
        id: h.id,
        type: h.type,
        createdAt: h.createdAt,
        title: ch?.title ?? ch?.channelId ?? "?",
        detail: `候補 ${meta.candidateCount ?? "?"} / Quota ${meta.quotaSpent ?? "?"}`,
        link: "/discover",
      };
    }
    default:
      return {
        id: h.id,
        type: h.type,
        createdAt: h.createdAt,
        title: h.keyword ?? "",
        detail: "",
        link: null,
      };
  }
}
