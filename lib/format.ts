/**
 * 数値・日付の表示用ヘルパー (横断利用)
 */

/** 大きな数値を 1.2M / 350K のように圧縮表示 */
export function compactNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("ja-JP", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/** カンマ区切り整数表示 */
export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("ja-JP").format(Math.round(n));
}

/** 小数 2 桁 + % */
export function formatPercent(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "-";
  return `${n.toFixed(2)}%`;
}

/** YYYY-MM-DD */
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (!Number.isFinite(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/\//g, "-");
}

/** 「3 日前」「2 ヶ月前」のような相対表示 */
export function formatRelative(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (!Number.isFinite(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);
  if (days < 1) return "今日";
  if (days < 7) return `${days} 日前`;
  if (days < 30) return `${Math.floor(days / 7)} 週間前`;
  if (days < 365) return `${Math.floor(days / 30)} ヶ月前`;
  return `${Math.floor(days / 365)} 年前`;
}
