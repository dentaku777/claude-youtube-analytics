import { Star } from "lucide-react";
import type { Metadata } from "next";
import { PlaceholderPanel } from "@/components/layout/PlaceholderPanel";

export const metadata: Metadata = { title: "Watchlist" };

export default function WatchlistPage() {
  return (
    <PlaceholderPanel
      title="Watchlist"
      description="注視するベンチマークチャンネルを最大 30 件まで管理。すべての分析機能の中心となります。"
      icon={Star}
    />
  );
}
