"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addToWatchlist } from "@/app/_actions/watchlist";

export function AddChannelForm() {
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    startTransition(async () => {
      const result = await addToWatchlist({ input: input.trim() });
      if (result.ok) {
        toast.success(result.message ?? "追加しました");
        setInput("");
      } else {
        toast.error(result.message ?? "追加に失敗しました");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 md:flex-row"
    >
      <Input
        placeholder="例: @youtube / https://youtube.com/@xxx / UCxxxxxxxxxxxxxxxxxxxxxx"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isPending}
        className="font-mono text-sm"
      />
      <Button type="submit" disabled={isPending || !input.trim()}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Plus className="mr-1 h-4 w-4" />
            追加
          </>
        )}
      </Button>
    </form>
  );
}
