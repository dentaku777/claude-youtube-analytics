import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { RequestResetForm } from "./_components/RequestResetForm";

export const metadata: Metadata = { title: "パスワードリセット" };

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="パスワードリセット"
      description="ご登録のメールアドレスにリセット用リンクを送信します"
      footer={
        <div className="w-full text-center text-xs">
          <Link href="/login" className="hover:text-foreground">
            ログイン画面に戻る
          </Link>
        </div>
      }
    >
      <RequestResetForm />
    </AuthCard>
  );
}
