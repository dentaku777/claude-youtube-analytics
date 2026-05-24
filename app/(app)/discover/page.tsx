import { Compass } from "lucide-react";
import type { Metadata } from "next";
import { PlaceholderPanel } from "@/components/layout/PlaceholderPanel";

export const metadata: Metadata = { title: "Discover" };

export default function DiscoverPage() {
  return (
    <PlaceholderPanel
      title="競合チャンネル発見"
      description="シードチャンネルから類似した競合チャンネルを発見。1 クリックで Watchlist に追加できます。"
      icon={Compass}
    />
  );
}
