/**
 * 伸び率 (Spread Rate) — 本システムの核心指標。
 * 定義: 動画の再生数 ÷ チャンネル登録者数 × 100 (%)
 * 要件 §1 用語定義 / F-SEARCH-11 / §3.3
 */

export type SpreadCategory = "win" | "healthy" | "low" | "unknown";

/**
 * 伸び率を計算する (%, 小数第 2 位まで)。
 * 登録者数が null (非公開) または 0 の場合は計算不能で null を返す。
 */
export function calcSpreadRate(
  viewCount: number,
  subscriberCount: number | null,
): number | null {
  if (subscriberCount === null || subscriberCount <= 0) return null;
  if (!Number.isFinite(viewCount) || viewCount < 0) return 0;
  const raw = (viewCount / subscriberCount) * 100;
  return Math.round(raw * 100) / 100;
}

/**
 * 伸び率の表示カテゴリ判定 (色分け用)。
 * 閾値はユーザー設定 (UserPreference.hitThreshold) で変更可能だが
 * デフォルトは要件 §3.3:
 *   - ≥ 100% : win (ライム)
 *   - 30-99% : healthy (アンバー)
 *   - < 30%  : low (グレー)
 */
export function classifySpread(
  spreadRate: number | null,
  hitThreshold = 100,
): SpreadCategory {
  if (spreadRate === null) return "unknown";
  if (spreadRate >= hitThreshold) return "win";
  if (spreadRate >= 30) return "healthy";
  return "low";
}

/**
 * 伸び率 ≥ hitThreshold (デフォルト 100%) で「勝ち動画」判定。
 */
export function isHit(spreadRate: number | null, hitThreshold = 100): boolean {
  return spreadRate !== null && spreadRate >= hitThreshold;
}
