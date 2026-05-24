import { History } from "lucide-react";
import type { Metadata } from "next";
import { PlaceholderPanel } from "@/components/empty-state/PlaceholderPanel";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <PlaceholderPanel
      title="検索履歴"
      description="過去の検索・比較・キーワード分析・競合発見の結果を再表示できます (最大 100 件)。"
      icon={History}
    />
  );
}
