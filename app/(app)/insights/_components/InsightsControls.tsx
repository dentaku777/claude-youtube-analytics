"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface InsightsControlsProps {
  channels: Array<{ channelId: string; channelTitle: string }>;
  selectedChannelIds: string[];
}

export function InsightsControls({
  channels,
  selectedChannelIds,
}: InsightsControlsProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedChannelIds),
  );

  function toggle(channelId: string) {
    const next = new Set(selected);
    if (next.has(channelId)) next.delete(channelId);
    else next.add(channelId);
    setSelected(next);
  }

  function selectAll() {
    setSelected(new Set(channels.map((c) => c.channelId)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  function apply() {
    const next = new URLSearchParams(params.toString());
    if (selected.size === 0) next.delete("channels");
    else next.set("channels", Array.from(selected).join(","));
    startTransition(() => {
      router.push(`/insights?${next.toString()}`);
    });
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          対象チャンネル ({selected.size} / {channels.length})
        </h3>
        <div className="flex items-center gap-1 text-xs">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={selectAll}
          >
            全選択
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={selectNone}
          >
            全解除
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {channels.map((c) => (
          <button
            key={c.channelId}
            type="button"
            onClick={() => toggle(c.channelId)}
            className="focus:outline-none"
          >
            <Badge
              variant={selected.has(c.channelId) ? "default" : "outline"}
              className="cursor-pointer transition-colors"
            >
              {c.channelTitle}
            </Badge>
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={apply}
          disabled={isPending || selected.size === 0}
        >
          {isPending && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
          適用
        </Button>
      </div>
    </div>
  );
}
