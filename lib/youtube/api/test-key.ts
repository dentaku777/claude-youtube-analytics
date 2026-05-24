import { createYouTubeClient } from "./client";
import { YouTubeApiError } from "./errors";
import type { YTChannelListResponse } from "../types";

/**
 * YouTube API キーの疎通テスト (要件 F-KEY-02)。
 * channels.list で `@youtube` を 1 件取得して 200 が返れば OK。Quota は 1 ユニット。
 */
export async function testYouTubeApiKey(apiKey: string): Promise<{
  ok: boolean;
  message: string;
  code?: string;
}> {
  if (!apiKey || typeof apiKey !== "string") {
    return { ok: false, message: "キーが空です", code: "EMPTY" };
  }
  if (!/^AIzaSy[A-Za-z0-9_-]{33}$/.test(apiKey.trim())) {
    return {
      ok: false,
      message: "キーの形式が正しくありません (AIzaSy で始まる 39 文字)",
      code: "FORMAT",
    };
  }

  try {
    const client = createYouTubeClient(apiKey.trim());
    const res = await client.get<YTChannelListResponse>("channels", {
      part: ["id"],
      forHandle: "@youtube",
      maxResults: 1,
    });
    if (!res.items || res.items.length === 0) {
      return { ok: false, message: "予期しないレスポンス", code: "UNEXPECTED" };
    }
    return { ok: true, message: "疎通成功" };
  } catch (e) {
    if (e instanceof YouTubeApiError) {
      return { ok: false, message: e.toDisplayMessage(), code: e.code };
    }
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
      code: "UNKNOWN",
    };
  }
}
