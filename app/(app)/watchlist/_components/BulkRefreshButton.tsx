"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { refreshAllWatchlist } from "@/app/_actions/watchlist";

/**
 * 全件再分析 (F-WATCH-07)。
 * 事前に Quota 消費見積もりを表示するモーダルあり。
 */
export function BulkRefreshButton({ channelCount }: { channelCount: number }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 1 ch あたり目安: channels.list (1) + playlistItems (1〜3) + videos (1〜3) ≈ 3〜7 ユニット
  const estimatedMin = channelCount * 3;
  const estimatedMax = channelCount * 7;

  function onConfirm() {
    setOpen(false);
    startTransition(async () => {
      toast.loading(`全 ${channelCount} 件を更新中...`, { id: "bulk-refresh" });
      const result = await refreshAllWatchlist();
      toast.dismiss("bulk-refresh");
      if (result.ok) {
        toast.success(
          `更新完了: ${result.succeeded} 件成功 / ${result.failed} 件失敗 (Quota ${result.totalQuota})`,
        );
      } else {
        toast.error(result.message ?? "更新に失敗しました");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={isPending || channelCount === 0}
        className="gap-1.5"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        全件再分析
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Quota 消費の確認
            </DialogTitle>
            <DialogDescription>
              Watchlist の {channelCount} チャンネルを全件再分析します。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              YouTube API Quota の概算消費:{" "}
              <span className="font-mono text-amber-400">
                {estimatedMin}〜{estimatedMax} ユニット
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              ※ チャンネル規模・動画数で変動します。日次上限は 10,000
              ユニットです。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={onConfirm}>実行</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
