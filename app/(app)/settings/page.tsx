import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { PlaceholderPanel } from "@/components/layout/PlaceholderPanel";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PlaceholderPanel
      title="設定"
      description="YouTube Data API キー・生成 AI API キー (OpenAI/Anthropic/Google) の一括管理。アカウント・表示設定も。"
      icon={Settings}
    />
  );
}
