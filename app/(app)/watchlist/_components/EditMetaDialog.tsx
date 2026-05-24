"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { updateWatchlistChannelMeta } from "@/app/_actions/watchlist";

export interface EditMetaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string | null;
  channelTitle: string;
  initialTags: string[];
  initialMemo: string;
}

export function EditMetaDialog({
  open,
  onOpenChange,
  channelId,
  channelTitle,
  initialTags,
  initialMemo,
}: EditMetaDialogProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const [memo, setMemo] = useState(initialMemo);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setTags(initialTags);
      setMemo(initialMemo);
      setTagInput("");
    }
  }, [open, initialTags, initialMemo]);

  function addTag() {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    if (tags.length >= 20) {
      toast.error("タグは最大 20 個まで");
      return;
    }
    setTags([...tags, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  function handleSave() {
    if (!channelId) return;
    startTransition(async () => {
      const result = await updateWatchlistChannelMeta({
        channelId,
        tags,
        memo,
      });
      if (result.ok) {
        toast.success("保存しました");
        onOpenChange(false);
      } else {
        toast.error(result.message ?? "保存に失敗しました");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{channelTitle}</DialogTitle>
          <DialogDescription>タグ・メモを編集</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">タグ（最大 20 個）</Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Badge key={t} variant="outline" className="gap-1 pl-2 pr-1">
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="rounded-sm hover:bg-zinc-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="例: ガジェット系"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                maxLength={40}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                追加
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">メモ（Markdown 可、最大 4000 字）</Label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              maxLength={4000}
              rows={6}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="このチャンネルの特徴・参考ポイントなど"
            />
            <p className="text-right text-[10px] text-muted-foreground">
              {memo.length} / 4000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
