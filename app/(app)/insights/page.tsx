import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import { PlaceholderPanel } from "@/components/layout/PlaceholderPanel";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return (
    <PlaceholderPanel
      title="横断インサイト"
      description="Watchlist 全体の勝ち動画パターン・投稿時間ヒートマップ・サムネギャラリー・タイトル頻出語を分析します。"
      icon={BarChart3}
    />
  );
}
