/**
 * ISO 8601 期間表記 (例: "PT4M13S") を秒数に変換する。
 * YouTube videos.list の contentDetails.duration はこの形式。
 *
 * 対応: PT[h]H[m]M[s]S (時間/分/秒のいずれか省略可)
 * 例:
 *   PT1H2M30S → 3750
 *   PT5M     → 300
 *   PT45S    → 45
 *   PT0S     → 0
 */
export function parseDurationToSeconds(iso: string): number {
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (
    (h ? parseInt(h, 10) * 3600 : 0) +
    (m ? parseInt(m, 10) * 60 : 0) +
    (s ? parseInt(s, 10) : 0)
  );
}

/**
 * 秒数を表示用文字列 (M:SS または H:MM:SS) に整形する。
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Shorts 判定 (60 秒以下)。要件 §1 用語定義に準拠。
 * 厳密には #shorts ハッシュタグも考慮すべきだが MVP では尺ベース。
 */
export function isShort(durationSec: number): boolean {
  return durationSec > 0 && durationSec <= 60;
}
