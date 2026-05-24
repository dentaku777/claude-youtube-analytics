import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { compactNumber } from "@/lib/format";
import { AddToWatchlistButton } from "@/components/watchlist/AddToWatchlistButton";
import type { ScoredCandidate } from "@/lib/discover/relevance-scorer";

export function CandidateList({
  candidates,
}: {
  candidates: ScoredCandidate[];
}) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-sm text-muted-foreground">
        類似チャンネルが見つかりませんでした
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {candidates.map((c) => (
        <div
          key={c.channelId}
          className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4"
        >
          <div className="flex items-start gap-3">
            {c.thumbnailUrl ? (
              <Image
                src={c.thumbnailUrl}
                alt={c.channelTitle}
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-full border border-zinc-800"
              />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-800" />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {c.channelTitle}
              </h3>
              <p className="font-mono text-[10px] text-muted-foreground">
                登録者:{" "}
                {c.subscriberCount !== null
                  ? compactNumber(c.subscriberCount)
                  : "非公開"}
              </p>
            </div>
            <span
              className="rounded-full bg-lime-400/15 px-2 py-0.5 font-mono text-xs font-bold text-lime-400"
              title={`キーワード一致 ${c.scoreBreakdown.keywordMatch} / 規模類似 ${c.scoreBreakdown.sizeSimilarity}`}
            >
              {(c.score * 100).toFixed(0)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            {c.hitKeywords.map((kw) => (
              <Badge key={kw} variant="outline" className="text-[10px]">
                {kw}
              </Badge>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <AddToWatchlistButton
              channelInput={c.channelId}
              channelTitle={c.channelTitle}
              variant="compact"
            />
            <Button asChild variant="outline" size="sm" className="h-7 gap-1">
              <Link
                href={`/search?input=${encodeURIComponent(c.channelId)}`}
              >
                <Search className="h-3 w-3" />
                分析
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
