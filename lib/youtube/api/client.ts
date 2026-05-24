import { YouTubeApiError } from "./errors";

const BASE_URL = "https://www.googleapis.com/youtube/v3";

export type QueryParams = Record<
  string,
  string | number | boolean | string[] | undefined | null
>;

export interface YouTubeClient {
  /**
   * GET リクエストを発行して JSON を返す。
   * - 失敗時は YouTubeApiError を throw する。
   * - 配列パラメータは comma-separated に変換 (例: part=['snippet','statistics'] → "snippet,statistics")
   */
  get<T = unknown>(path: string, params: QueryParams): Promise<T>;
}

/**
 * ユーザーごとに 1 つ生成する想定の軽量クライアント。
 * 鍵は server-side でのみ復号した平文を渡すこと (CLAUDE.md セキュリティ原則)。
 */
export function createYouTubeClient(apiKey: string): YouTubeClient {
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("createYouTubeClient: apiKey is required");
  }

  return {
    async get<T>(path: string, params: QueryParams): Promise<T> {
      const url = new URL(`${BASE_URL}/${path.replace(/^\//, "")}`);
      url.searchParams.set("key", apiKey);

      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(","));
        } else {
          url.searchParams.set(key, String(value));
        }
      }

      let response: Response;
      try {
        response = await fetch(url, {
          method: "GET",
          cache: "no-store",
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        throw new YouTubeApiError("NETWORK", 0, message);
      }

      if (response.ok) {
        return response.json() as Promise<T>;
      }

      // エラーレスポンスの解析
      const errorBody = (await response.json().catch(() => null)) as
        | {
            error?: {
              code?: number;
              message?: string;
              errors?: Array<{ reason?: string; message?: string }>;
            };
          }
        | null;
      const reason = errorBody?.error?.errors?.[0]?.reason;
      const message =
        errorBody?.error?.message ?? `HTTP ${response.status} ${response.statusText}`;

      if (response.status === 400) {
        throw new YouTubeApiError("BAD_REQUEST", 400, message, reason);
      }
      if (response.status === 403) {
        if (reason === "quotaExceeded") {
          throw new YouTubeApiError("QUOTA_EXCEEDED", 403, message, reason);
        }
        if (reason === "keyInvalid") {
          throw new YouTubeApiError("KEY_INVALID", 403, message, reason);
        }
        throw new YouTubeApiError("KEY_FORBIDDEN", 403, message, reason);
      }
      if (response.status === 404) {
        throw new YouTubeApiError("NOT_FOUND", 404, message, reason);
      }
      if (response.status >= 500) {
        throw new YouTubeApiError("SERVER_ERROR", response.status, message, reason);
      }
      throw new YouTubeApiError("UNKNOWN", response.status, message, reason);
    },
  };
}
