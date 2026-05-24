"use client";

import { useState, useTransition } from "react";
import { Star, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToWatchlist } from "@/app/_actions/watchlist";
import { toast } from "sonner";

/**
 * 「★ Watchlist に追加」共通ボタン (F-UI-08, F-SEARCH-16)。
 * 動画 / チャンネル一覧から 1 クリックで追加できる。
 */
export function AddToWatchlistButton({
  channelInput,
  channelTitle,
  variant = "default",
}: {
  channelInput: string; // URL / @handle / channelId
  channelTitle?: string;
  variant?: "default" | "compact";
}) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function onClick() {
    startTransition(async () => {
      const result = await addToWatchlist({ input: channelInput });
      if (result.ok) {
        setAdded(true);
        toast.success(
          `${channelTitle ?? "チャンネル"} を Watchlist に追加しました`,
        );
      } else if (result.code === "DUPLICATE") {
        setAdded(true);
        toast.info("既に Watchlist に登録されています");
      } else {
        toast.error(result.message ?? "追加に失敗しました");
      }
    });
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isPending || added}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-lime-400 disabled:opacity-50"
        aria-label="Watchlist に追加"
        title="Watchlist に追加"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : added ? (
          <Check className="h-3.5 w-3.5 text-lime-400" />
        ) : (
          <Star className="h-3.5 w-3.5" />
        )}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isPending || added}
      className="gap-1.5"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : added ? (
        <>
          <Check className="h-3.5 w-3.5 text-lime-400" />
          追加済み
        </>
      ) : (
        <>
          <Star className="h-3.5 w-3.5" />
          Watchlist に追加
        </>
      )}
    </Button>
  );
}
