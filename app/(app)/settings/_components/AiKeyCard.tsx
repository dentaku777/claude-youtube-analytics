"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, AlertCircle, Trash2, Sparkles } from "lucide-react";
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
import { saveApiKey, deleteApiKey } from "@/app/_actions/apikey";

type AiProvider = "OPENAI" | "ANTHROPIC" | "GOOGLE_AI";

const META: Record<
  AiProvider,
  { label: string; placeholder: string; description: string }
> = {
  OPENAI: {
    label: "OpenAI",
    placeholder: "sk-...",
    description: "GPT-4 系。タイトル生成 / コンテンツギャップ分析 (Phase 2 後半)",
  },
  ANTHROPIC: {
    label: "Anthropic",
    placeholder: "sk-ant-...",
    description: "Claude 系。長文要約 / 競合分析 (Phase 2 後半)",
  },
  GOOGLE_AI: {
    label: "Google Generative AI",
    placeholder: "AIzaSy...",
    description: "Gemini 系。サムネ評価 (Phase 2 後半)",
  },
};

export interface AiKeyCardProps {
  provider: AiProvider;
  registered: boolean;
  masked: string | null;
}

export function AiKeyCard({ provider, registered, masked }: AiKeyCardProps) {
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const meta = META[provider];

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const r = await saveApiKey({ provider, apiKey: input });
      setResult({ ok: r.ok, message: r.message ?? "" });
      if (r.ok) setInput("");
    });
  }

  function handleDelete() {
    if (!confirm(`${meta.label} のキーを削除しますか?`)) return;
    setResult(null);
    startTransition(async () => {
      const r = await deleteApiKey({ provider });
      setResult({ ok: r.ok, message: r.message ?? "" });
    });
  }

  return (
    <Card className="border-zinc-800 bg-zinc-950/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            {meta.label}
          </CardTitle>
          {registered ? (
            <Badge
              variant="outline"
              className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
            >
              <Check className="mr-1 h-3 w-3" />
              保存済
            </Badge>
          ) : (
            <Badge variant="outline" className="border-zinc-700 text-zinc-500">
              未登録
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">{meta.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {registered && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
            <span className="font-mono text-xs text-zinc-400">{masked}</span>
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
        )}

        <form onSubmit={handleSave} className="space-y-2">
          <Label htmlFor={`${provider}-key`} className="text-xs">
            {registered ? "新しいキーで上書き" : "API キーを登録"}
          </Label>
          <div className="flex gap-2">
            <Input
              id={`${provider}-key`}
              type="password"
              autoComplete="off"
              placeholder={meta.placeholder}
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
            保存のみ (MVP では AI 機能未実装)。AES-256-GCM で暗号化されます
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
