/**
 * YouTube Data API v3 の Quota コスト一覧
 * 公式: https://developers.google.com/youtube/v3/determine_quota_cost
 *
 * 1 日上限: API キーごとに 10,000 ユニット (PST 0:00 / JST 17:00 リセット)
 */
export const QUOTA_COST = {
  // ─── 読み取り系 (本プロジェクトで使用) ───
  CHANNELS_LIST: 1,
  PLAYLIST_ITEMS_LIST: 1,
  VIDEOS_LIST: 1, // 50 件まで 1 ユニット
  SEARCH_LIST: 100, // 高コスト (要件 F-KEYWORD/F-DISCOVER)
} as const;

export const DAILY_QUOTA_LIMIT = 10_000;

/**
 * Quota 残量低下警告の閾値 (UI 赤色化)
 * 要件 F-UI-09 / エラーハンドリング §6 «残量警告»
 */
export const QUOTA_WARNING_THRESHOLD = 1_000;
