"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeftRight, Loader2 } from "lucide-react";
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

export function CompareForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const init = params.get("inputs")?.split(",") ?? [];
  const [c1, setC1] = useState(init[0] ?? "");
  const [c2, setC2] = useState(init[1] ?? "");
  const [c3, setC3] = useState(init[2] ?? "");
  const [period, setPeriod] = useState(params.get("period") ?? "3m");
  const [videoType, setVideoType] = useState(params.get("type") ?? "all");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const inputs = [c1, c2, c3].map((s) => s.trim()).filter((s) => s.length > 0);
    if (inputs.length === 0) return;
    const next = new URLSearchParams({
      inputs: inputs.join(","),
      period,
      type: videoType,
    });
    startTransition(() => {
      router.push(`/compare?${next.toString()}`);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4"
    >
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { idx: 1, value: c1, setter: setC1 },
          { idx: 2, value: c2, setter: setC2 },
          { idx: 3, value: c3, setter: setC3 },
        ].map(({ idx, value, setter }) => (
          <div key={idx} className="space-y-1">
            <Label htmlFor={`compare-${idx}`} className="text-xs">
              チャンネル {idx}
            </Label>
            <Input
              id={`compare-${idx}`}
              placeholder={
                idx === 1
                  ? "例: @youtube (必須)"
                  : `任意 (最大 3 チャンネル)`
              }
              value={value}
              onChange={(e) => setter(e.target.value)}
              disabled={isPending}
              className="font-mono text-sm"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[140px_140px_auto]">
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
          <Button
            type="submit"
            disabled={isPending || (!c1.trim() && !c2.trim() && !c3.trim())}
            className="w-full"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                比較
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
