import { describe, it, expect } from "vitest";
import { calcChannelKpi } from "@/lib/youtube/kpi/channel";
import { enrichVideosWithKpi } from "@/lib/youtube/kpi/video";
import type { ChannelMeta, VideoEntry } from "@/lib/youtube/types";

function makeMeta(overrides: Partial<ChannelMeta> = {}): ChannelMeta {
  return {
    channelId: "UC1",
    title: "Test",
    publishedAt: new Date("2020-01-01T00:00:00Z"),
    subscriberCount: 1000,
    videoCount: 100,
    viewCount: 1_000_000,
    uploadsPlaylistId: "UU1",
    ...overrides,
  };
}

function makeVideo(views: number, daysAgo = 1): VideoEntry {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    videoId: `v-${views}`,
    title: "x",
    publishedAt: d,
    durationSec: 120,
    isShort: false,
    viewCount: views,
    likeCount: null,
    commentCount: null,
    hashtags: [],
  };
}

describe("calcChannelKpi", () => {
  it("基本: avgViewsPerVideo は viewCount/videoCount", () => {
    const meta = makeMeta();
    const kpi = calcChannelKpi(meta, [], 30);
    expect(kpi.avgViewsPerVideo).toBe(10_000); // 1M / 100
  });

  it("videoCount 0 のときは avgViewsPerVideo null", () => {
    const meta = makeMeta({ videoCount: 0 });
    const kpi = calcChannelKpi(meta, [], 30);
    expect(kpi.avgViewsPerVideo).toBeNull();
  });

  it("avgSpreadRate は期間内動画の伸び率平均", () => {
    const meta = makeMeta({ subscriberCount: 1000 });
    const videos = [makeVideo(500), makeVideo(1500), makeVideo(2000)];
    const withKpi = enrichVideosWithKpi(videos, 1000);
    // 伸び率: 50%, 150%, 200% → 平均 133.33
    const kpi = calcChannelKpi(meta, withKpi, 30);
    expect(kpi.avgSpreadRate).toBe(133.33);
  });

  it("subscriberCount null では伸び率計算不能で avgSpreadRate も null", () => {
    const meta = makeMeta({ subscriberCount: null });
    const videos = [makeVideo(1000), makeVideo(2000)];
    const withKpi = enrichVideosWithKpi(videos, null);
    const kpi = calcChannelKpi(meta, withKpi, 30);
    expect(kpi.avgSpreadRate).toBeNull();
  });

  it("postingFrequencyPerDay は本数/日数", () => {
    const meta = makeMeta();
    const videos = [makeVideo(1), makeVideo(2), makeVideo(3)];
    const withKpi = enrichVideosWithKpi(videos, 1000);
    const kpi = calcChannelKpi(meta, withKpi, 30);
    expect(kpi.postingFrequencyPerDay).toBe(0.1); // 3/30
  });

  it("periodDays null では postingFrequencyPerDay null", () => {
    const meta = makeMeta();
    const kpi = calcChannelKpi(meta, [], null);
    expect(kpi.postingFrequencyPerDay).toBeNull();
  });

  it("hitsInPeriod は 100% 以上の本数", () => {
    const meta = makeMeta({ subscriberCount: 1000 });
    const videos = [
      makeVideo(500), // 50%
      makeVideo(999), // 99.9%
      makeVideo(1000), // 100% = hit
      makeVideo(5000), // 500% = hit
    ];
    const withKpi = enrichVideosWithKpi(videos, 1000);
    const kpi = calcChannelKpi(meta, withKpi, 30);
    expect(kpi.hitsInPeriod).toBe(2);
  });

  it("カスタム閾値 (50) で hitsInPeriod が増える", () => {
    const meta = makeMeta({ subscriberCount: 1000 });
    const videos = [makeVideo(400), makeVideo(600), makeVideo(1500)]; // 40%, 60%, 150%
    const withKpi = enrichVideosWithKpi(videos, 1000, 50);
    const kpi = calcChannelKpi(meta, withKpi, 30, 50);
    expect(kpi.hitsInPeriod).toBe(2); // 60% と 150%
  });
});
