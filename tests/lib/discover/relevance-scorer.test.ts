import { describe, it, expect } from "vitest";
import { scoreCandidate } from "@/lib/discover/relevance-scorer";

const baseHit = {
  channelId: "UC1",
  channelTitle: "ch",
  hitKeywords: ["a", "b"],
  matchCount: 2,
};

describe("scoreCandidate", () => {
  it("キーワード全一致 + 規模同一 + 伸び率同一でスコア最大", () => {
    const r = scoreCandidate(
      {
        hit: baseHit,
        subscriberCount: 10000,
        avgSpreadRate: 80,
      },
      {
        subscriberCount: 10000,
        avgSpreadRate: 80,
        totalKeywords: 2,
      },
    );
    expect(r.score).toBe(1);
  });

  it("キーワード一致 0 で重み 0.5 が反映される", () => {
    const r = scoreCandidate(
      {
        hit: { ...baseHit, matchCount: 0 },
        subscriberCount: 10000,
        avgSpreadRate: 80,
      },
      {
        subscriberCount: 10000,
        avgSpreadRate: 80,
        totalKeywords: 2,
      },
    );
    expect(r.score).toBeCloseTo(0.5, 2);
  });

  it("規模が大きく異なるとスコアが下がる", () => {
    const r1 = scoreCandidate(
      {
        hit: baseHit,
        subscriberCount: 100,
        avgSpreadRate: 80,
      },
      {
        subscriberCount: 100000,
        avgSpreadRate: 80,
        totalKeywords: 2,
      },
    );
    expect(r1.score).toBeLessThan(0.8);
    expect(r1.scoreBreakdown.sizeSimilarity).toBeLessThan(0.1);
  });

  it("登録者数 null は規模類似 0 扱い", () => {
    const r = scoreCandidate(
      {
        hit: baseHit,
        subscriberCount: null,
        avgSpreadRate: 80,
      },
      {
        subscriberCount: 10000,
        avgSpreadRate: 80,
        totalKeywords: 2,
      },
    );
    expect(r.scoreBreakdown.sizeSimilarity).toBe(0);
  });
});
