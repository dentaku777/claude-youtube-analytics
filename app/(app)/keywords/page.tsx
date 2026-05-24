import type { Metadata } from "next";
import { ApiProvider } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { hasApiKey } from "@/lib/api-keys/vault";
import { KeyMissingPanel } from "@/components/empty-state/KeyMissingPanel";
import { KeywordResearchPanel } from "./_components/KeywordResearchPanel";

export const metadata: Metadata = { title: "Keywords" };

export default async function KeywordsPage() {
  const user = await requireUser();
  const hasKey = await hasApiKey(user.id, ApiProvider.YOUTUBE);
  if (!hasKey) {
    return <KeyMissingPanel pageLabel="キーワード市場分析" />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          キーワード市場分析
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          検索キーワードの市場規模・競合数・伸び率分布を可視化します。
        </p>
      </header>
      <KeywordResearchPanel />
    </div>
  );
}
