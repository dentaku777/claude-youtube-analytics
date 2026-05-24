/**
 * YouTube Data API のエラー種別
 *
 * 設計書 §4.5 / 要件 F-KEY-08 のチェックリスト表示はこの種別に基づいて分岐する
 */
export type YouTubeErrorCode =
  | "KEY_INVALID" // 403 keyInvalid
  | "KEY_FORBIDDEN" // 403 forbidden (API 未有効化など)
  | "QUOTA_EXCEEDED" // 403 quotaExceeded
  | "NOT_FOUND" // 404
  | "BAD_REQUEST" // 400 (パラメータ誤り等)
  | "SERVER_ERROR" // 5xx
  | "NETWORK" // fetch 自体が失敗
  | "UNKNOWN";

export class YouTubeApiError extends Error {
  readonly code: YouTubeErrorCode;
  readonly status: number;
  readonly reason?: string;

  constructor(
    code: YouTubeErrorCode,
    status: number,
    message: string,
    reason?: string,
  ) {
    super(message);
    this.name = "YouTubeApiError";
    this.code = code;
    this.status = status;
    this.reason = reason;
  }

  /** UI 表示用の日本語メッセージ (設計書 §4.5) */
  toDisplayMessage(): string {
    switch (this.code) {
      case "QUOTA_EXCEEDED":
        return "本日の YouTube API 利用枠 (Quota) を使い切りました。JST 17:00 にリセットされます。";
      case "KEY_INVALID":
        return "API キーが無効です。/settings から正しいキーを再登録してください。";
      case "KEY_FORBIDDEN":
        return "API キーが拒否されました。YouTube Data API v3 が有効化されているか確認してください。";
      case "NOT_FOUND":
        return "チャンネル / 動画が見つかりません。URL を再確認してください。";
      case "BAD_REQUEST":
        return "リクエスト内容に誤りがあります。";
      case "SERVER_ERROR":
        return "YouTube API で一時的なエラーが発生しました。少し時間をおいて再試行してください。";
      case "NETWORK":
        return "ネットワークエラーが発生しました。接続を確認してください。";
      default:
        return `エラーが発生しました: ${this.message}`;
    }
  }
}
