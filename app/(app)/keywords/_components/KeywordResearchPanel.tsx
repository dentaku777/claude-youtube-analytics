"use client";

import { useState, useTransition } from "react";
import { Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuotaConfirmDialog } from "@/components/common/QuotaConfirmDialog";
import {
  runKeywordResearch,
  type KeywordResearchActionResult,
} from "@/app/_actions/keywords";
import { MarketResultView } from "./MarketResultView";

export function KeywordResearchPanel() {
  const [keyword, setKeyword] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<KeywordResearchActionResult | null>(null);

  // search 100 + videos 2 (for 50 ids twice: once for details, once for snippet) + channels ≤ 50/50
  const estimatedQuota = 100 + 2 + 1;

  function handleSearch() {
    if (!keyword.trim()) return;
    setConfirmOpen(true);
  }

  function onConfirm() {
    setConfirmOpen(false);
    startTransition(async () => {
      const r = await runKeywordResearch({ keyword: keyword.trim() });
      setResult(r);
      if (!r.ok) toast.error(r.message);
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 md:flex-row"
      >
        <Input
          placeholder="例: ASMR / vlog / Vlog プログラミング 入門"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          disabled={isPending}
          className="text-sm"
        />
        <Button type="submit" disabled={isPending || !keyword.trim()}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Globe className="mr-1 h-4 w-4" />
              市場分析
            </>
          )}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        ⚠ 1 回の検索で約 {estimatedQuota} Quota
        ユニットを消費します（日次上限 10,000）。
      </p>

      <QuotaConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        estimatedQuota={estimatedQuota}
        description={`「${keyword}」のキーワード市場分析を実行します。`}
        onConfirm={onConfirm}
        isPending={isPending}
      />

      {result && !result.ok && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong className="block">分析失敗 ({result.code})</strong>
            <span className="text-xs">{result.message}</span>
          </AlertDescription>
        </Alert>
      )}

      {result && result.ok && <MarketResultView result={result.result} />}
    </div>
  );
}
