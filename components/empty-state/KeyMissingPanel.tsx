import Link from "next/link";
import { KeyRound, ArrowRight, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * API キーが未登録のときに、分析画面 (search/compare 等) で表示するパネル。
 * 要件 F-UI-06 / F-SEARCH-02 のキー未設定誘導モーダル相当。
 * MVP では Dialog ではなく Card として中央表示 (ページ遷移を伴うため Dialog だと操作性悪い)。
 */
export function KeyMissingPanel({
  pageLabel = "この機能",
}: {
  pageLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-xl py-12">
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
            <KeyRound className="h-5 w-5 text-amber-400" />
          </div>
          <CardTitle className="text-lg">
            分析を始めるには API キーが必要です
          </CardTitle>
          <CardDescription>
            {pageLabel}を使うには、ご自身の YouTube Data API v3 キーを設定画面に登録してください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-md border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
            <p className="font-semibold text-foreground">📝 取得手順 (約 5 分)</p>
            <ol className="ml-4 list-decimal space-y-1 text-xs text-muted-foreground">
              <li>Google Cloud Console にアクセス</li>
              <li>新規プロジェクト作成 (既存可)</li>
              <li>「YouTube Data API v3」を有効化</li>
              <li>「認証情報」→「+ 認証情報を作成」→「API キー」</li>
              <li>(推奨) API 制限で YouTube Data API v3 のみに絞る</li>
            </ol>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-info hover:underline"
            >
              Google Cloud Console を開く
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-2 rounded-md border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-muted-foreground">
            <p>
              <span className="text-foreground">🔒 セキュリティ:</span>{" "}
              キーはサーバー側で AES-256-GCM 暗号化されて保存され、クライアント (ブラウザ) には決して送られません。
            </p>
            <p>
              <span className="text-foreground">📊 Quota:</span>{" "}
              無料枠は 1 日 10,000 ユニット (JST 17:00 リセット)。
            </p>
          </div>

          <Button asChild className="w-full" size="lg">
            <Link href="/settings">
              設定画面で API キーを登録
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
