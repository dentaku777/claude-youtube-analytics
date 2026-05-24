import { describe, it, expect } from "vitest";
import { buildMonthlyTrend } from "@/lib/youtube/kpi/trend";
import type { VideoEntry } from "@/lib/youtube/types";

function makeVideo(publishedAt: string, views: number): VideoEntry {
  return {
    videoId: "x",
    title: "x",
    publishedAt: new Date(publishedAt),
    durationSec: 60,
    isShort: true,
    viewCount: views,
    likeCount: null,
    commentCount: null,
  };
}

describe("buildMonthlyTrend", () => {
  const now = new Date("2026-05-15T00:00:00Z");

  it("12 ヶ月分のバケットを返す (動画なしの月は 0)", () => {
    const trend = buildMonthlyTrend([], 12, now);
    expect(trend).toHaveLength(12);
    expect(trend[0].postCount).toBe(0);
    expect(trend[11].postCount).toBe(0);
    // 最新月が末尾
    expect(trend[11].yearMonth).toBe("2026-05");
    expect(trend[0].yearMonth).toBe("2025-06");
  });

  it("動画を月別に集計する", () => {
    const videos = [
      makeVideo("2026-05-10T00:00:00Z", 100),
      makeVideo("2026-05-20T00:00:00Z", 200),
      makeVideo("2026-04-15T00:00:00Z", 50),
    ];
    const trend = buildMonthlyTrend(videos, 12, now);
    const may = trend.find((t) => t.yearMonth === "2026-05")!;
    const apr = trend.find((t) => t.yearMonth === "2026-04")!;
    expect(may.postCount).toBe(2);
    expect(may.totalViews).toBe(300);
    expect(apr.postCount).toBe(1);
    expect(apr.totalViews).toBe(50);
  });

  it("範囲外の動画は集計しない", () => {
    const videos = [makeVideo("2020-01-01T00:00:00Z", 9999)];
    const trend = buildMonthlyTrend(videos, 12, now);
    const total = trend.reduce((sum, t) => sum + t.totalViews, 0);
    expect(total).toBe(0);
  });
});
