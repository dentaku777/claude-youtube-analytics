import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/app/_actions/auth";

export const metadata: Metadata = { title: "メールアドレスの確認" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard title="メール認証">
        <Alert variant="destructive">
          <AlertDescription>トークンが指定されていません。</AlertDescription>
        </Alert>
      </AuthCard>
    );
  }

  const result = await verifyEmail(token);

  return (
    <AuthCard title="メールアドレスの確認">
      <Alert variant={result.ok ? "default" : "destructive"}>
        <AlertDescription>{result.message}</AlertDescription>
      </Alert>
      <div className="mt-6">
        <Button asChild className="w-full">
          <Link href="/login">ログイン画面へ</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
