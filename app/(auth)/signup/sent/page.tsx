import Link from "next/link";
import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "確認メールを送信しました" };

export default async function SignupSentPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthCard
      title="確認メールを送信しました"
      footer={
        <div className="w-full text-center text-xs">
          メールが届かない場合は迷惑メールフォルダもご確認ください
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-lime-400/30 bg-lime-400/10">
          <Mail className="h-6 w-6 text-lime-400" />
        </div>

        {email ? (
          <p className="text-sm text-foreground">
            <span className="font-mono text-lime-400">{email}</span>
            <br />
            宛に確認メールを送信しました
          </p>
        ) : (
          <p className="text-sm text-foreground">
            ご入力のメールアドレス宛に確認メールを送信しました
          </p>
        )}

        <p className="text-sm leading-relaxed text-muted-foreground">
          メール内の「メールアドレスを確認する」ボタンをクリックして登録を完了してください。
          <br />
          リンクは <span className="text-foreground">24 時間</span> で期限切れになります。
        </p>

        <div className="mt-4 w-full">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">ログイン画面へ戻る</Link>
          </Button>
        </div>
      </div>
    </AuthCard>
  );
}
