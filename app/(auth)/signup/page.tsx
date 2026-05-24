import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "./_components/SignupForm";

export const metadata: Metadata = { title: "サインアップ" };

export default function SignupPage() {
  return (
    <AuthCard
      title="アカウント作成"
      description="メールアドレスとパスワードでアカウントを作成"
      footer={
        <div className="w-full text-center text-xs">
          既にアカウントをお持ちですか?{" "}
          <Link href="/login" className="text-foreground hover:underline">
            ログイン
          </Link>
        </div>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
