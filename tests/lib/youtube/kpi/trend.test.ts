import { describe, it, expect } from "vitest";
import { buildTrend } from "@/lib/youtube/kpi/trend";
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
    hashtags: [],
  };
}

describe("buildTrend (month)", () => {
  const now = new Date("2026-05-15T00:00:00Z");

  it("12 ヶ月分のバケットを返す (動画なしの月は 0)", () => {
    const trend = buildTrend([], "month", 12, now);
    expect(trend).toHaveLength(12);
    expect(trend[0].postCount).toBe(0);
    expect(trend[11].postCount).toBe(0);
    // 最新月が末尾
    expect(trend[11].bucket).toBe("2026-05");
    expect(trend[0].bucket).toBe("2025-06");
  });

  it("動画を月別に集計する", () => {
    const videos = [
      makeVideo("2026-05-10T00:00:00Z", 100),
      makeVideo("2026-05-20T00:00:00Z", 200),
      makeVideo("2026-04-15T00:00:00Z", 50),
    ];
    const trend = buildTrend(videos, "month", 12, now);
    const may = trend.find((t) => t.bucket === "2026-05")!;
    const apr = trend.find((t) => t.bucket === "2026-04")!;
    expect(may.postCount).toBe(2);
    expect(may.totalViews).toBe(300);
    expect(apr.postCount).toBe(1);
    expect(apr.totalViews).toBe(50);
  });

  it("範囲外の動画は集計しない", () => {
    const videos = [makeVideo("2020-01-01T00:00:00Z", 9999)];
    const trend = buildTrend(videos, "month", 12, now);
    const total = trend.reduce((sum, t) => sum + t.totalViews, 0);
    expect(total).toBe(0);
  });

  it("バケット数 3 で 3 ヶ月分のみ", () => {
    const trend = buildTrend([], "month", 3, now);
    expect(trend).toHaveLength(3);
    expect(trend.map((t) => t.bucket)).toEqual(["2026-03", "2026-04", "2026-05"]);
  });
});

describe("buildTrend (day)", () => {
  const now = new Date("2026-05-15T12:00:00Z");

  it("7 日分のバケットを返す", () => {
    const trend = buildTrend([], "day", 7, now);
    expect(trend).toHaveLength(7);
    expect(trend[6].bucket).toBe("2026-05-15");
    expect(trend[0].bucket).toBe("2026-05-09");
  });

  it("動画を日別に集計する", () => {
    const videos = [
      makeVideo("2026-05-15T03:00:00Z", 10),
      makeVideo("2026-05-15T20:00:00Z", 20),
      makeVideo("2026-05-14T09:00:00Z", 5),
    ];
    const trend = buildTrend(videos, "day", 7, now);
    const d15 = trend.find((t) => t.bucket === "2026-05-15")!;
    const d14 = trend.find((t) => t.bucket === "2026-05-14")!;
    expect(d15.postCount).toBe(2);
    expect(d15.totalViews).toBe(30);
    expect(d14.postCount).toBe(1);
    expect(d14.totalViews).toBe(5);
  });
});
