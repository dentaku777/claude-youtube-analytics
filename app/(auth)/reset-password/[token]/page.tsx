import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetForm } from "./_components/ResetForm";

export const metadata: Metadata = { title: "パスワード再設定" };

export default async function ResetTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <AuthCard
      title="新しいパスワードを設定"
      description="リセットリンクから新しいパスワードを設定してください"
    >
      <ResetForm token={token} />
    </AuthCard>
  );
}
