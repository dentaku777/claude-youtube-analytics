import { Globe } from "lucide-react";
import type { Metadata } from "next";
import { PlaceholderPanel } from "@/components/empty-state/PlaceholderPanel";

export const metadata: Metadata = { title: "Keywords" };

export default function KeywordsPage() {
  return (
    <PlaceholderPanel
      title="キーワード市場分析"
      description="検索キーワードの市場規模・競合数・伸び率分布を可視化します。Quota 消費 100 ユニット/回。"
      icon={Globe}
    />
  );
}
