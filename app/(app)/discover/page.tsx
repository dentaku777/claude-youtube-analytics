import type { Metadata } from "next";
import { ApiProvider } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { hasApiKey } from "@/lib/api-keys/vault";
import { KeyMissingPanel } from "@/components/empty-state/KeyMissingPanel";
import { DiscoverPanel } from "./_components/DiscoverPanel";

export const metadata: Metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const user = await requireUser();
  const hasKey = await hasApiKey(user.id, ApiProvider.YOUTUBE);
  if (!hasKey) {
    return <KeyMissingPanel pageLabel="競合チャンネル発見" />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          競合チャンネル発見
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          シードチャンネルの直近動画タイトルから頻出語を抽出し、類似する競合チャンネルを発見します。
        </p>
      </header>
      <DiscoverPanel />
    </div>
  );
}
