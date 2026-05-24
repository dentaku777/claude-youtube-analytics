import { describe, it, expect } from "vitest";
import { extractHitPatterns } from "@/lib/insights/pattern-extractor";
import type { AggregatedVideo } from "@/lib/insights/aggregate";

function makeVideo(opts: Partial<AggregatedVideo>): AggregatedVideo {
  return {
    videoId: "v",
    title: "x",
    publishedAt: new Date("2026-05-20T00:00:00Z"),
    durationSec: 300,
    isShort: false,
    viewCount: 100,
    likeCount: 0,
    commentCount: 0,
    thumbnailUrl: undefined,
    hashtags: [],
    spreadRate: 50,
    spreadCategory: "healthy",
    engagement: { likeRate: 0, commentRate: 0, viralScore: 0 },
    channelId: "UC1",
    channelTitle: "ch1",
    ...opts,
  };
}

describe("extractHitPatterns", () => {
  it("ヒット動画 (≥100%) を抽出", () => {
    const videos = [
      makeVideo({ spreadRate: 200 }),
      makeVideo({ spreadRate: 80 }),
      makeVideo({ spreadRate: 150 }),
    ];
    const s = extractHitPatterns(videos, 100);
    expect(s.hitCount).toBe(2);
    expect(s.totalCount).toBe(3);
  });

  it("Shorts と通常を区別する", () => {
    const videos = [
      makeVideo({ isShort: true, spreadRate: 150, durationSec: 30 }),
      makeVideo({ isShort: true, spreadRate: 50, durationSec: 30 }),
      makeVideo({ isShort: false, spreadRate: 200 }),
    ];
    const s = extractHitPatterns(videos, 100);
    expect(s.shortsHits).toBe(1);
    expect(s.shortsTotal).toBe(2);
    expect(s.regularHits).toBe(1);
    expect(s.regularTotal).toBe(1);
  });

  it("尺バケット分類", () => {
    const videos = [
      makeVideo({ durationSec: 30, spreadRate: 200, isShort: true }),
      makeVideo({ durationSec: 180, spreadRate: 200 }),
      makeVideo({ durationSec: 1500, spreadRate: 200 }),
    ];
    const s = extractHitPatterns(videos);
    expect(s.durationBuckets.find((b) => b.label === "≤60s (Shorts)")?.hits).toBe(1);
    expect(s.durationBuckets.find((b) => b.label === "1–5 分")?.hits).toBe(1);
    expect(s.durationBuckets.find((b) => b.label === "20 分超")?.hits).toBe(1);
  });

  it("曜日別集計", () => {
    // 2026-05-17 = 日, 2026-05-18 = 月
    const videos = [
      makeVideo({
        publishedAt: new Date("2026-05-17T10:00:00Z"),
        spreadRate: 200,
      }),
      makeVideo({
        publishedAt: new Date("2026-05-18T10:00:00Z"),
        spreadRate: 200,
      }),
    ];
    const s = extractHitPatterns(videos);
    expect(s.dayOfWeek[0].hits).toBe(1); // 日
    expect(s.dayOfWeek[1].hits).toBe(1); // 月
  });
});
