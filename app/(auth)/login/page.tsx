import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "./_components/LoginForm";

export const metadata: Metadata = { title: "ログイン" };

export default function LoginPage() {
  return (
    <AuthCard
      title="ログイン"
      description="Youtube Analyzer にサインインしてください"
      footer={
        <div className="flex w-full justify-between text-xs">
          <Link href="/reset-password" className="hover:text-foreground">
            パスワードを忘れた方
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            新規登録はこちら
          </Link>
        </div>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
