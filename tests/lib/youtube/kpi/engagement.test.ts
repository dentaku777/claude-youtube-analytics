import { describe, it, expect } from "vitest";
import { calcEngagement } from "@/lib/youtube/kpi/engagement";

describe("calcEngagement", () => {
  it("基本: 高評価率/コメント率/バイラル係数を計算", () => {
    const r = calcEngagement({
      viewCount: 10000,
      likeCount: 500,
      commentCount: 50,
      subscriberCount: 1000,
    });
    expect(r.likeRate).toBe(5); // 500/10000 = 5%
    expect(r.commentRate).toBe(0.5); // 50/10000 = 0.5%
    // spread = 10000/1000*100 = 1000%
    // viral = 1000 * 5 / 100 = 50
    expect(r.viralScore).toBe(50);
  });

  it("likeCount null は likeRate も viralScore も null", () => {
    const r = calcEngagement({
      viewCount: 100,
      likeCount: null,
      commentCount: 5,
      subscriberCount: 100,
    });
    expect(r.likeRate).toBeNull();
    expect(r.commentRate).toBe(5);
    expect(r.viralScore).toBeNull();
  });

  it("viewCount 0 は全 null (0除算回避)", () => {
    const r = calcEngagement({
      viewCount: 0,
      likeCount: 10,
      commentCount: 1,
      subscriberCount: 100,
    });
    expect(r.likeRate).toBeNull();
    expect(r.commentRate).toBeNull();
    expect(r.viralScore).toBeNull();
  });

  it("subscriberCount null は viralScore のみ null (rate は計算可)", () => {
    const r = calcEngagement({
      viewCount: 100,
      likeCount: 10,
      commentCount: 1,
      subscriberCount: null,
    });
    expect(r.likeRate).toBe(10);
    expect(r.commentRate).toBe(1);
    expect(r.viralScore).toBeNull();
  });
});
