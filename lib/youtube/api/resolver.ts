import type { YouTubeClient } from "./client";
import { YouTubeApiError } from "./errors";
import { QUOTA_COST } from "../quota/cost";
import type { YTChannelListResponse } from "../types";

/**
 * 入力文字列から YouTube channelId (UC...) を解決する。
 *
 * 対応形式:
 *  - UC で始まる 24 文字の channelId 直接 (例: UCxxxxxxxxxxxxxxxxxxxxxx)
 *  - https://www.youtube.com/channel/UC...
 *  - @handle 単体 (例: @youtube)
 *  - https://www.youtube.com/@handle
 *  - https://youtube.com/c/customname (旧 custom URL) — handle 扱いで解決を試みる
 *
 * @returns resolved channelId と消費した quota コスト
 */
export interface ResolveResult {
  channelId: string;
  quotaSpent: number; // 消費したユニット (0 = API 呼び出しなし)
}

const UC_ID_REGEX = /^UC[\w-]{22}$/;
const CHANNEL_URL_REGEX = /channel\/(UC[\w-]{22})/;
const HANDLE_URL_REGEX = /(?:youtube\.com\/)?@([\w.\-_]+)/;
const CUSTOM_URL_REGEX = /youtube\.com\/c\/([\w.\-_]+)/;

export async function resolveChannelId(
  input: string,
  client: YouTubeClient,
): Promise<ResolveResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new YouTubeApiError(
      "BAD_REQUEST",
      400,
      "チャンネルの入力が空です",
    );
  }

  // 1) channelId 直接
  if (UC_ID_REGEX.test(trimmed)) {
    return { channelId: trimmed, quotaSpent: 0 };
  }

  // 2) /channel/UC... URL
  const ucMatch = trimmed.match(CHANNEL_URL_REGEX);
  if (ucMatch) {
    return { channelId: ucMatch[1], quotaSpent: 0 };
  }

  // 3) @handle (URL もしくは単体)
  const handleMatch = trimmed.match(HANDLE_URL_REGEX);
  if (handleMatch) {
    const handle = handleMatch[1];
    const channelId = await lookupChannelByHandle(handle, client);
    return { channelId, quotaSpent: QUOTA_COST.CHANNELS_LIST };
  }

  // 4) /c/customname URL (handle 風に解決を試みる)
  const customMatch = trimmed.match(CUSTOM_URL_REGEX);
  if (customMatch) {
    const handle = customMatch[1];
    const channelId = await lookupChannelByHandle(handle, client);
    return { channelId, quotaSpent: QUOTA_COST.CHANNELS_LIST };
  }

  throw new YouTubeApiError(
    "BAD_REQUEST",
    400,
    `チャンネルの入力形式が認識できません: ${trimmed.slice(0, 80)}`,
  );
}

async function lookupChannelByHandle(
  handle: string,
  client: YouTubeClient,
): Promise<string> {
  const response = await client.get<YTChannelListResponse>("channels", {
    part: ["id"],
    forHandle: `@${handle}`,
    maxResults: 1,
  });

  const channelId = response.items?.[0]?.id;
  if (!channelId) {
    throw new YouTubeApiError(
      "NOT_FOUND",
      404,
      `ハンドル @${handle} のチャンネルが見つかりません`,
    );
  }
  return channelId;
}
