import { Badge } from "@/components/ui/badge";

/**
 * Quota 残量バナー (F-UI-09)。
 * Phase 1 ではプレースホルダ。Phase 2 で `lib/youtube/quota-tracker.ts` を実装後に
 * 実際の残量を Server Component から取得して表示する。
 */
export function QuotaBanner() {
  return (
    <div className="flex items-center justify-end gap-3 border-b border-border px-6 py-2 text-xs text-muted-foreground">
      <span>YouTube API Quota</span>
      <Badge
        variant="outline"
        className="border-zinc-700 font-mono tabular-nums text-zinc-400"
      >
        --- / 10,000
      </Badge>
      <span className="text-zinc-600">(Phase 2 で計測開始)</span>
    </div>
  );
}
