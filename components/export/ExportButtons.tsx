"use client";

import { useState, useTransition } from "react";
import { Download, FileSpreadsheet, FileArchive, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildTsv, type ExportRow } from "@/lib/csv/builder";

export interface ExportButtonsProps {
  /** /api/export/csv | zip に渡すクエリパラメータ (input or inputs / period / videoType / type) */
  query: Record<string, string>;
  /** TSV コピー用 (現在画面で表示中の行) */
  tsvRows: ExportRow[];
}

export function ExportButtons({ query, tsvRows }: ExportButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const qs = new URLSearchParams(query).toString();
  const csvUrl = `/api/export/csv?${qs}`;
  const zipUrl = `/api/export/zip?${qs}`;

  async function copyTsv() {
    try {
      const tsv = buildTsv(tsvRows);
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("clipboard copy failed:", e);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        asChild
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={isPending}
      >
        <a href={csvUrl} onClick={() => startTransition(() => {})}>
          <FileSpreadsheet className="h-3.5 w-3.5" />
          CSV
        </a>
      </Button>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={isPending}
      >
        <a href={zipUrl} onClick={() => startTransition(() => {})}>
          <FileArchive className="h-3.5 w-3.5" />
          サムネ ZIP
        </a>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={copyTsv}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-lime-400" />
            コピーしました
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Sheets コピー
          </>
        )}
      </Button>
      <span className="hidden text-xs text-muted-foreground md:inline">
        <Download className="mr-1 inline h-3 w-3" />
        ダウンロード / Sheets ペースト用 TSV
      </span>
    </div>
  );
}
