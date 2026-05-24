import { describe, it, expect } from "vitest";
import {
  calcSpreadRate,
  classifySpread,
  isHit,
} from "@/lib/youtube/kpi/spread-rate";

describe("calcSpreadRate", () => {
  it("基本: views/subs * 100", () => {
    expect(calcSpreadRate(100, 1000)).toBe(10);
    expect(calcSpreadRate(1000, 1000)).toBe(100);
    expect(calcSpreadRate(2500, 1000)).toBe(250);
  });
  it("小数第 2 位で丸める", () => {
    expect(calcSpreadRate(1, 3)).toBe(33.33);
    expect(calcSpreadRate(2, 3)).toBe(66.67);
  });
  it("登録者数 null (非公開) は null", () => {
    expect(calcSpreadRate(1000, null)).toBeNull();
  });
  it("登録者数 0 は null (0 除算回避)", () => {
    expect(calcSpreadRate(1000, 0)).toBeNull();
  });
  it("登録者数が負は null", () => {
    expect(calcSpreadRate(1000, -1)).toBeNull();
  });
  it("再生数 0 は 0%", () => {
    expect(calcSpreadRate(0, 1000)).toBe(0);
  });
  it("再生数 NaN は 0", () => {
    expect(calcSpreadRate(NaN, 1000)).toBe(0);
  });
});

describe("classifySpread", () => {
  it("デフォルト閾値 (100) で win/healthy/low/unknown", () => {
    expect(classifySpread(150)).toBe("win");
    expect(classifySpread(100)).toBe("win"); // 境界 = win
    expect(classifySpread(99.99)).toBe("healthy");
    expect(classifySpread(30)).toBe("healthy"); // 境界 = healthy
    expect(classifySpread(29.99)).toBe("low");
    expect(classifySpread(0)).toBe("low");
    expect(classifySpread(null)).toBe("unknown");
  });
  it("hitThreshold をカスタマイズできる (UserPreference.hitThreshold)", () => {
    expect(classifySpread(60, 50)).toBe("win"); // 50% 閾値で 60% は勝ち
    expect(classifySpread(40, 50)).toBe("healthy");
  });
});

describe("isHit", () => {
  it("勝ち動画判定", () => {
    expect(isHit(100)).toBe(true);
    expect(isHit(99)).toBe(false);
    expect(isHit(null)).toBe(false);
    expect(isHit(50, 30)).toBe(true); // カスタム閾値
  });
});
