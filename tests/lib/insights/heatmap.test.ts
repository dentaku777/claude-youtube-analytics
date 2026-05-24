import { describe, it, expect } from "vitest";
import { buildPostingHeatmap } from "@/lib/insights/heatmap";
import type { AggregatedVideo } from "@/lib/insights/aggregate";

function v(publishedAt: string, views = 100, spread: number | null = 50): AggregatedVideo {
  return {
    videoId: "v",
    title: "x",
    publishedAt: new Date(publishedAt),
    durationSec: 60,
    isShort: false,
    viewCount: views,
    likeCount: 0,
    commentCount: 0,
    thumbnailUrl: undefined,
    hashtags: [],
    spreadRate: spread,
    spreadCategory: "healthy",
    engagement: { likeRate: 0, commentRate: 0, viralScore: 0 },
    channelId: "UC1",
    channelTitle: "ch1",
  };
}

describe("buildPostingHeatmap", () => {
  it("168 セル (7 日 × 24 時) を返す", () => {
    const r = buildPostingHeatmap([]);
    expect(r.cells).toHaveLength(168);
  });

  it("JST 換算で曜日/時間バケットに集計する", () => {
    // 2026-05-17T15:00:00Z = JST 2026-05-18T00:00 = 月曜 0 時
    const videos = [v("2026-05-17T15:00:00Z", 1000, 50)];
    const r = buildPostingHeatmap(videos);
    const cell = r.cells.find((c) => c.day === 1 && c.hour === 0)!;
    expect(cell.postCount).toBe(1);
    expect(cell.totalViews).toBe(1000);
    expect(cell.avgSpread).toBe(50);
  });

  it("maxPostCount を返す", () => {
    const videos = [
      v("2026-05-18T00:00:00Z"),
      v("2026-05-18T00:30:00Z"),
      v("2026-05-19T05:00:00Z"),
    ];
    const r = buildPostingHeatmap(videos);
    expect(r.maxPostCount).toBeGreaterThanOrEqual(1);
  });
});
