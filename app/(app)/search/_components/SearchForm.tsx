"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const PERIOD_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "1w", label: "1 週間" },
  { value: "1m", label: "1 ヶ月" },
  { value: "3m", label: "3 ヶ月" },
  { value: "6m", label: "6 ヶ月" },
  { value: "1y", label: "1 年" },
  { value: "3y", label: "3 年" },
  { value: "6y", label: "6 年" },
  { value: "all", label: "全期間" },
];

const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "shorts", label: "Shorts のみ" },
  { value: "regular", label: "通常動画のみ" },
];

export function SearchForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [input, setInput] = useState(params.get("input") ?? "");
  const [period, setPeriod] = useState(params.get("period") ?? "3m");
  const [videoType, setVideoType] = useState(params.get("type") ?? "all");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const next = new URLSearchParams({
      input: input.trim(),
      period,
      type: videoType,
    });
    startTransition(() => {
      router.push(`/search?${next.toString()}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_140px_140px_auto]">
        <div className="space-y-1">
          <Label htmlFor="input" className="text-xs">
            チャンネル URL / @ハンドル / channel ID
          </Label>
          <Input
            id="input"
            placeholder="例: @youtube / https://youtube.com/@xxx / UCxxxxxxxxxxxxxxxxxxxxxx"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isPending}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">期間</Label>
          <Select value={period} onValueChange={setPeriod} disabled={isPending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">動画タイプ</Label>
          <Select
            value={videoType}
            onValueChange={setVideoType}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={isPending || !input.trim()} className="w-full">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                分析
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
