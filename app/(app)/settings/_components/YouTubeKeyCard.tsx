"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, AlertCircle, Trash2, KeyRound } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { saveApiKey, deleteApiKey, testApiKey } from "@/app/_actions/apikey";

export interface YouTubeKeyCardProps {
  registered: boolean;
  masked: string | null;
  lastVerifiedAt: Date | null;
}

export function YouTubeKeyCard({
  registered,
  masked,
  lastVerifiedAt,
}: YouTubeKeyCardProps) {
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const r = await saveApiKey({ provider: "YOUTUBE", apiKey: input });
      setResult({ ok: r.ok, message: r.message ?? "" });
      if (r.ok) setInput("");
    });
  }

  function handleDelete() {
    if (!confirm("YouTube API キーを削除しますか? 分析機能が利用できなくなります。")) {
      return;
    }
    setResult(null);
    startTransition(async () => {
      const r = await deleteApiKey({ provider: "YOUTUBE" });
      setResult({ ok: r.ok, message: r.message ?? "" });
    });
  }

  function handleTest() {
    setResult(null);
    startTransition(async () => {
      const r = await testApiKey({ provider: "YOUTUBE" });
      setResult({ ok: r.ok, message: r.message ?? "" });
    });
  }

  return (
    <Card className="border-zinc-800 bg-zinc-950/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-lime-400" />
            YouTube Data API v3
          </CardTitle>
          {registered ? (
            <Badge
              variant="outline"
              className="border-lime-500/30 bg-lime-500/10 text-lime-400"
            >
              <Check className="mr-1 h-3 w-3" />
              登録済
            </Badge>
          ) : (
            <Badge variant="outline" className="border-zinc-700 text-zinc-500">
              未登録
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          チャンネル分析・キーワード検索など全ての分析機能に必須。
          無料枠 10,000 ユニット/日 (JST 17:00 リセット)。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {registered && (
          <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-zinc-400">{masked}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={handleTest}
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "疎通確認"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-900/50 text-red-400 hover:bg-red-950/30"
                  disabled={isPending}
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {lastVerifiedAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                最終疎通確認: {formatDate(lastVerifiedAt)}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-2">
          <Label htmlFor="youtube-key" className="text-xs">
            {registered ? "新しいキーで上書き" : "API キーを登録"}
          </Label>
          <div className="flex gap-2">
            <Input
              id="youtube-key"
              type="password"
              autoComplete="off"
              placeholder="AIzaSy..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isPending}
              className="font-mono"
            />
            <Button type="submit" disabled={isPending || !input.trim()}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "保存"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            登録時に YouTube API へ疎通確認を行います (Quota 1 ユニット消費)
          </p>
        </form>

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
      </CardContent>
    </Card>
  );
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}
