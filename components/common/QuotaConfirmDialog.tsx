"use client";

import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Quota 大量消費系 API (search.list 等) の事前確認ダイアログ (F-UI-10, F-KEYWORD-02)
 */
export function QuotaConfirmDialog({
  open,
  onOpenChange,
  estimatedQuota,
  description,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimatedQuota: number;
  description: string;
  onConfirm: () => void;
  isPending?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Quota 消費の確認
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>
            YouTube API Quota の概算消費:{" "}
            <span className="font-mono text-amber-400">
              {estimatedQuota} ユニット
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            ※ 日次上限は 10,000 ユニット (JST 17:00 リセット)
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            実行
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
