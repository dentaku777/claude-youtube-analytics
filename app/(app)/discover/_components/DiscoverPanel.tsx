"use client";

import { useState, useTransition } from "react";
import { Compass, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuotaConfirmDialog } from "@/components/common/QuotaConfirmDialog";
import {
  discoverRelatedChannels,
  type DiscoverResult,
} from "@/app/_actions/discover";
import { CandidateList } from "./CandidateList";

export function DiscoverPanel() {
  const [input, setInput] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<DiscoverResult | null>(null);

  // 内訳: resolve 1 + channels 1 + playlistItems ~3 + videos ~3 +
  //       search 100×5keywords + channels 1〜2
  // ≒ ~510
  const estimatedQuota = 510;

  function handleSubmit() {
    if (!input.trim()) return;
    setConfirmOpen(true);
  }
  function onConfirm() {
    setConfirmOpen(false);
    startTransition(async () => {
      const r = await discoverRelatedChannels({ input: input.trim() });
      setResult(r);
      if (!r.ok) toast.error(r.message);
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 md:flex-row"
      >
        <Input
          placeholder="シードチャンネル: @youtube / https://youtube.com/@xxx / UCxxx..."
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
              <Compass className="mr-1 h-4 w-4" />
              競合を発見
            </>
          )}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        ⚠ 概算 {estimatedQuota} Quota
        ユニットを消費します（キーワード抽出 + 5 種類の search.list を実行）。
      </p>

      <QuotaConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        estimatedQuota={estimatedQuota}
        description={`シードチャンネルの直近動画タイトルから頻出語を 5 件抽出し、それぞれで類似チャンネルを検索します。`}
        onConfirm={onConfirm}
        isPending={isPending}
      />

      {result && !result.ok && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong className="block">発見失敗 ({result.code})</strong>
            <span className="text-xs">{result.message}</span>
          </AlertDescription>
        </Alert>
      )}

      {result && result.ok && (
        <>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs text-muted-foreground">
              シード:{" "}
              <span className="font-semibold text-foreground">
                {result.seedMeta.title}
              </span>
            </p>
            <p className="mt-1 text-xs">
              抽出キーワード:
              {result.seedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="ml-1 inline-block rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-cyan-400"
                >
                  {kw}
                </span>
              ))}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Quota 消費:{" "}
              <span className="font-mono">{result.quotaSpent}</span> ユニット
            </p>
          </div>
          <CandidateList candidates={result.candidates} />
        </>
      )}
    </div>
  );
}
