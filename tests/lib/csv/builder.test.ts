import { describe, it, expect } from "vitest";
import { buildCsv, buildTsv, type ExportRow } from "@/lib/csv/builder";

function row(overrides: Partial<ExportRow> = {}): ExportRow {
  return {
    videoId: "abc123",
    title: "テスト動画",
    publishedAt: new Date("2026-05-20T00:00:00Z"),
    durationSec: 300,
    isShort: false,
    viewCount: 1000,
    likeCount: 50,
    commentCount: 10,
    thumbnailUrl: undefined,
    hashtags: ["#vlog", "#日本"],
    spreadRate: 150.5,
    spreadCategory: "win",
    engagement: { likeRate: 5, commentRate: 1, viralScore: 7.5 },
    channelTitle: "テストチャンネル",
    ...overrides,
  } as ExportRow;
}

describe("buildCsv", () => {
  it("BOM + ヘッダー + データ行を出力", () => {
    const csv = buildCsv([row()]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("チャンネル");
    expect(csv).toContain("abc123");
    expect(csv).toContain("テスト動画");
    expect(csv).toContain("https://www.youtube.com/watch?v=abc123");
  });

  it("カンマ・ダブルクォート・改行を含む値を escape", () => {
    const csv = buildCsv([row({ title: 'a,b"c\nd' })]);
    // 改行は文字列としては "..." で囲まれて中に LF を含む
    expect(csv).toMatch(/"a,b""c\nd"/);
  });

  it("hashtags をスペース連結で出力", () => {
    const csv = buildCsv([row()]);
    expect(csv).toContain("#vlog #日本");
  });
});

describe("buildTsv", () => {
  it("ヘッダー + タブ区切りデータ", () => {
    const tsv = buildTsv([row()]);
    const lines = tsv.split("\n");
    expect(lines[0].split("\t").length).toBeGreaterThan(5);
    expect(lines[1]).toContain("abc123");
  });

  it("タブと改行を空白に置換", () => {
    const tsv = buildTsv([row({ title: "a\tb\nc" })]);
    expect(tsv).toContain("a b c");
  });
});
