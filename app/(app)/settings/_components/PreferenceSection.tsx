"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, AlertCircle, SlidersHorizontal, RotateCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_HIT_THRESHOLD,
  DEFAULT_PAGE_SIZE,
  DEFAULT_VISIBLE_COLUMNS,
  PAGE_SIZE_OPTIONS,
  TOGGLEABLE_COLUMNS,
  VIDEO_COLUMNS,
  type PageSize,
  type VideoColumnId,
} from "@/lib/preference/columns";
import { updatePreference } from "@/app/_actions/preference";

export interface PreferenceSectionProps {
  initialVisibleColumns: VideoColumnId[];
  initialPageSize: PageSize;
  initialHitThreshold: number;
}

const REQUIRED_IDS = new Set<VideoColumnId>(
  VIDEO_COLUMNS.filter((c) => c.required).map((c) => c.id),
);

export function PreferenceSection({
  initialVisibleColumns,
  initialPageSize,
  initialHitThreshold,
}: PreferenceSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [columns, setColumns] = useState<Set<VideoColumnId>>(
    () => new Set(initialVisibleColumns),
  );
  const [pageSize, setPageSize] = useState<PageSize>(initialPageSize);
  const [hitThreshold, setHitThreshold] = useState<string>(
    String(initialHitThreshold),
  );
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  function toggleColumn(id: VideoColumnId) {
    setColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    // 必須列を自動付加して保存 (UI 上で隠していても DB は完全な状態を持つ)
    const toSave: VideoColumnId[] = [];
    for (const c of VIDEO_COLUMNS) {
      if (REQUIRED_IDS.has(c.id) || columns.has(c.id)) toSave.push(c.id);
    }

    const threshold = Number(hitThreshold);
    if (!Number.isFinite(threshold)) {
      setResult({ ok: false, message: "勝ち動画閾値は数値で入力してください" });
      return;
    }

    startTransition(async () => {
      const r = await updatePreference({
        visibleColumns: toSave,
        pageSize,
        hitThreshold: threshold,
      });
      setResult({ ok: r.ok, message: r.message ?? "" });
    });
  }

  function handleReset() {
    setColumns(new Set(DEFAULT_VISIBLE_COLUMNS));
    setPageSize(DEFAULT_PAGE_SIZE);
    setHitThreshold(String(DEFAULT_HIT_THRESHOLD));
    setResult(null);
  }

  // トグル可能な列のうち実際に有効になっているもの (必須列は別計算)
  const toggleableSelected = TOGGLEABLE_COLUMNS.filter((c) =>
    columns.has(c.id),
  ).length;

  return (
    <Card className="border-zinc-800 bg-zinc-950/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="h-4 w-4 text-lime-400" />
          表示設定
        </CardTitle>
        <CardDescription className="text-xs">
          /search の動画一覧に表示する列・1 ページの件数・「勝ち動画」と判定する伸び率を設定します
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          {/* 表示列 */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              表示する列 ({toggleableSelected} / {TOGGLEABLE_COLUMNS.length})
            </legend>
            <p className="text-xs text-muted-foreground">
              サムネ・タイトル・外部リンクは常時表示されます
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TOGGLEABLE_COLUMNS.map((col) => {
                const checked = columns.has(col.id);
                return (
                  <label
                    key={col.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm transition-colors hover:bg-zinc-900/60"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleColumn(col.id)}
                      disabled={isPending}
                      className="h-4 w-4 cursor-pointer accent-lime-500"
                    />
                    <span className={checked ? "text-foreground" : "text-zinc-500"}>
                      {col.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* 1 ページ件数 + 勝ち動画閾値 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pageSize" className="text-xs uppercase tracking-wide text-zinc-500">
                1 ページの表示件数
              </Label>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v) as PageSize)}
                disabled={isPending}
              >
                <SelectTrigger id="pageSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} 件 / ページ
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hitThreshold" className="text-xs uppercase tracking-wide text-zinc-500">
                勝ち動画と判定する伸び率 (%)
              </Label>
              <Input
                id="hitThreshold"
                type="number"
                min={1}
                max={1000}
                step={1}
                value={hitThreshold}
                onChange={(e) => setHitThreshold(e.target.value)}
                disabled={isPending}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                デフォルト {DEFAULT_HIT_THRESHOLD}%。動画の再生数 ÷ 登録者数 がこの値以上で「勝ち」(ライム色)
              </p>
            </div>
          </div>

          {result && (
            <Alert variant={result.ok ? "default" : "destructive"}>
              {result.ok ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isPending}
              className="text-xs text-zinc-400 hover:text-foreground"
            >
              <RotateCcw className="mr-1.5 h-3 w-3" />
              デフォルトに戻す
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "保存"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
