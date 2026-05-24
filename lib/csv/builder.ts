import type { VideoWithKpi } from "@/lib/youtube/kpi/video";

/**
 * 動画一覧を CSV / TSV 文字列に変換する (F-EXPORT-01,02,05)。
 * CSV: ダブルクォート escape + UTF-8 BOM
 * TSV: タブ区切り (Google Sheets コピペ用)
 */

export type ExportRow = VideoWithKpi & {
  /** 比較画面など複数 ch のときに付与 */
  channelTitle?: string;
};

export const EXPORT_HEADERS = [
  "channelTitle",
  "videoId",
  "title",
  "publishedAt",
  "durationSec",
  "isShort",
  "viewCount",
  "likeCount",
  "commentCount",
  "spreadRate",
  "spreadCategory",
  "hashtags",
  "url",
] as const;

const HEADER_LABELS_JA: Record<(typeof EXPORT_HEADERS)[number], string> = {
  channelTitle: "チャンネル",
  videoId: "videoId",
  title: "タイトル",
  publishedAt: "公開日時",
  durationSec: "長さ(秒)",
  isShort: "Shorts",
  viewCount: "再生数",
  likeCount: "高評価",
  commentCount: "コメント",
  spreadRate: "伸び率(%)",
  spreadCategory: "ヒット判定",
  hashtags: "ハッシュタグ",
  url: "YouTube URL",
};

function rowToCells(row: ExportRow): string[] {
  return [
    row.channelTitle ?? "",
    row.videoId,
    row.title,
    row.publishedAt.toISOString(),
    String(row.durationSec),
    row.isShort ? "1" : "0",
    String(row.viewCount),
    row.likeCount !== null ? String(row.likeCount) : "",
    row.commentCount !== null ? String(row.commentCount) : "",
    row.spreadRate !== null ? row.spreadRate.toFixed(2) : "",
    row.spreadCategory,
    row.hashtags.join(" "),
    `https://www.youtube.com/watch?v=${row.videoId}`,
  ];
}

/** CSV セルとして Excel/Sheets 互換にエスケープ */
function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** TSV セル: タブ・改行を空白に置換 (シンプル) */
function tsvEscape(s: string): string {
  return s.replace(/[\t\r\n]+/g, " ");
}

export function buildCsv(rows: ExportRow[]): string {
  const headerLine = EXPORT_HEADERS.map((h) => csvEscape(HEADER_LABELS_JA[h])).join(",");
  const dataLines = rows.map((r) => rowToCells(r).map(csvEscape).join(","));
  // Excel 文字化け対策の BOM
  return "﻿" + [headerLine, ...dataLines].join("\r\n");
}

export function buildTsv(rows: ExportRow[]): string {
  const headerLine = EXPORT_HEADERS.map((h) => tsvEscape(HEADER_LABELS_JA[h])).join("\t");
  const dataLines = rows.map((r) => rowToCells(r).map(tsvEscape).join("\t"));
  return [headerLine, ...dataLines].join("\n");
}
