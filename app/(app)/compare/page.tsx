import { ArrowLeftRight } from "lucide-react";
import type { Metadata } from "next";
import { PlaceholderPanel } from "@/components/empty-state/PlaceholderPanel";

export const metadata: Metadata = { title: "Compare" };

export default function ComparePage() {
  return (
    <PlaceholderPanel
      title="チャンネル比較"
      description="最大 3 チャンネルを並列で分析し、KPI と推移グラフを重ね合わせて比較します。"
      icon={ArrowLeftRight}
    />
  );
}
