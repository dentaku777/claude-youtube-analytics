import { Search } from "lucide-react";
import type { Metadata } from "next";
import { PlaceholderPanel } from "@/components/layout/PlaceholderPanel";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <PlaceholderPanel
      title="単一チャンネル分析"
      description="チャンネル URL / @ハンドル / channel ID を入力するだけで、KPI と推移グラフを表示します。"
      icon={Search}
    />
  );
}
