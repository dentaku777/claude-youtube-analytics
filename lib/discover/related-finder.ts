import type { YouTubeClient } from "@/lib/youtube/api/client";
import { QUOTA_COST } from "@/lib/youtube/quota/cost";

/**
 * 抽出キーワード群を順次 search.list して候補チャンネル ID を収集する (F-DISCOVER)
 *
 * Quota: keyword 数 × 100 (search)
 */

export interface RelatedFinderInput {
  keywords: string[];
  excludeChannelId: string; // シードチャンネル自身
  maxPerKeyword?: number; // 既定 20
}

export interface RelatedChannelHit {
  channelId: string;
  channelTitle: string;
  hitKeywords: string[]; // どのキーワードでヒットしたか
  matchCount: number;
}

export async function findRelatedChannels(
  client: YouTubeClient,
  input: RelatedFinderInput,
): Promise<{ hits: RelatedChannelHit[]; quotaSpent: number }> {
  const max = input.maxPerKeyword ?? 20;
  const channelMap = new Map<string, RelatedChannelHit>();
  let quotaSpent = 0;

  for (const kw of input.keywords) {
    const r = await client.get<{
      items?: Array<{
        snippet?: { channelId?: string; channelTitle?: string };
      }>;
    }>("search", {
      q: kw,
      part: ["snippet"],
      type: "channel",
      maxResults: max,
      order: "relevance",
    });
    quotaSpent += QUOTA_COST.SEARCH_LIST;

    for (const it of r.items ?? []) {
      const cid = it.snippet?.channelId;
      const ctitle = it.snippet?.channelTitle ?? "";
      if (!cid || cid === input.excludeChannelId) continue;
      const existing = channelMap.get(cid);
      if (existing) {
        if (!existing.hitKeywords.includes(kw)) {
          existing.hitKeywords.push(kw);
          existing.matchCount++;
        }
      } else {
        channelMap.set(cid, {
          channelId: cid,
          channelTitle: ctitle,
          hitKeywords: [kw],
          matchCount: 1,
        });
      }
    }
  }

  const hits = Array.from(channelMap.values()).sort(
    (a, b) => b.matchCount - a.matchCount,
  );
  return { hits, quotaSpent };
}
