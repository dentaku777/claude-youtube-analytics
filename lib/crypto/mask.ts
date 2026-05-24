/**
 * API キーを UI 表示用にマスクする (要件 F-KEY-06)。
 * 形式: 先頭 6 文字 + "****...****" + 末尾 4 文字
 * 例: "AIzaSy1234567890abcdef" → "AIzaSy****...****cdef"
 */
export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 10) return "****"; // 短すぎる場合は全マスク
  return `${key.slice(0, 6)}****...****${key.slice(-4)}`;
}
