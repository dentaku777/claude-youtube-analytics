import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Youtube Analyzer",
    template: "%s | Youtube Analyzer",
  },
  description:
    "新規動画クリエイター向け YouTube 市場分析ツール — Watchlist 中心の横断分析でニッチ戦略を可視化",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
