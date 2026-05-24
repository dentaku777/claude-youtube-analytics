import { describe, it, expect } from "vitest";
import {
  parseDurationToSeconds,
  formatDuration,
  isShort,
} from "@/lib/youtube/kpi/duration";

describe("parseDurationToSeconds", () => {
  it("時間・分・秒を全て含む", () => {
    expect(parseDurationToSeconds("PT1H2M30S")).toBe(3750);
  });
  it("分のみ", () => {
    expect(parseDurationToSeconds("PT5M")).toBe(300);
  });
  it("秒のみ", () => {
    expect(parseDurationToSeconds("PT45S")).toBe(45);
  });
  it("時間のみ", () => {
    expect(parseDurationToSeconds("PT2H")).toBe(7200);
  });
  it("0 秒", () => {
    expect(parseDurationToSeconds("PT0S")).toBe(0);
  });
  it("不正な形式は 0", () => {
    expect(parseDurationToSeconds("invalid")).toBe(0);
    expect(parseDurationToSeconds("")).toBe(0);
  });
});

describe("formatDuration", () => {
  it("1 時間未満は M:SS", () => {
    expect(formatDuration(45)).toBe("0:45");
    expect(formatDuration(125)).toBe("2:05");
    expect(formatDuration(3599)).toBe("59:59");
  });
  it("1 時間以上は H:MM:SS", () => {
    expect(formatDuration(3600)).toBe("1:00:00");
    expect(formatDuration(3750)).toBe("1:02:30");
    expect(formatDuration(7200)).toBe("2:00:00");
  });
  it("不正値は 0:00", () => {
    expect(formatDuration(NaN)).toBe("0:00");
    expect(formatDuration(-10)).toBe("0:00");
  });
});

describe("isShort", () => {
  it("60 秒以下は true", () => {
    expect(isShort(60)).toBe(true);
    expect(isShort(45)).toBe(true);
    expect(isShort(1)).toBe(true);
  });
  it("60 秒超は false", () => {
    expect(isShort(61)).toBe(false);
    expect(isShort(180)).toBe(false);
  });
  it("0 や負数は false", () => {
    expect(isShort(0)).toBe(false);
    expect(isShort(-1)).toBe(false);
  });
});
