import { describe, it, expect, vi } from "vitest";
import {
  fetchChannelMeta,
  fetchUploadVideoIds,
  fetchVideoDetails,
  fetchChannelData,
  periodToCutoffDate,
} from "@/lib/youtube/fetcher";
import type { YouTubeClient } from "@/lib/youtube/client";
import { YouTubeApiError } from "@/lib/youtube/errors";

function mockClient(responseQueue: unknown[]): YouTubeClient {
  const queue = [...responseQueue];
  return {
    get: vi.fn().mockImplementation(async () => {
      if (queue.length === 0) throw new Error("mock queue exhausted");
      return queue.shift();
    }),
  };
}

describe("periodToCutoffDate", () => {
  const now = new Date("2026-05-24T00:00:00Z");
  it("'1w' は 7 日前", () => {
    expect(periodToCutoffDate("1w", now)?.toISOString().slice(0, 10)).toBe(
      "2026-05-17",
    );
  });
  it("'all' は null", () => {
    expect(periodToCutoffDate("all", now)).toBeNull();
  });
  it("'1y' は 1 年前", () => {
    expect(periodToCutoffDate("1y", now)?.toISOString().slice(0, 10)).toBe(
      "2025-05-24",
    );
  });
});

describe("fetchChannelMeta", () => {
  it("正常: メタ情報を整形して返す", async () => {
    const client = mockClient([
      {
        items: [
          {
            id: "UC123",
            snippet: {
              title: "Test Channel",
              description: "desc",
              publishedAt: "2020-01-01T00:00:00Z",
              thumbnails: { high: { url: "https://thumb/h.jpg" } },
            },
            statistics: {
              viewCount: "100000",
              subscriberCount: "1000",
              videoCount: "50",
            },
            contentDetails: { relatedPlaylists: { uploads: "UU123" } },
          },
        ],
      },
    ]);
    const { meta, quotaSpent } = await fetchChannelMeta("UC123", client);
    expect(meta.channelId).toBe("UC123");
    expect(meta.title).toBe("Test Channel");
    expect(meta.subscriberCount).toBe(1000);
    expect(meta.videoCount).toBe(50);
    expect(meta.viewCount).toBe(100000);
    expect(meta.uploadsPlaylistId).toBe("UU123");
    expect(meta.thumbnailUrl).toBe("https://thumb/h.jpg");
    expect(quotaSpent).toBe(1);
  });

  it("hiddenSubscriberCount のときは null", async () => {
    const client = mockClient([
      {
        items: [
          {
            id: "UC123",
            snippet: { title: "X", publishedAt: "2020-01-01T00:00:00Z" },
            statistics: {
              viewCount: "0",
              hiddenSubscriberCount: true,
              videoCount: "0",
            },
            contentDetails: { relatedPlaylists: { uploads: "UU123" } },
          },
        ],
      },
    ]);
    const { meta } = await fetchChannelMeta("UC123", client);
    expect(meta.subscriberCount).toBeNull();
  });

  it("items が空なら NOT_FOUND", async () => {
    const client = mockClient([{ items: [] }]);
    await expect(fetchChannelMeta("UC123", client)).rejects.toThrow(
      YouTubeApiError,
    );
  });
});

describe("fetchUploadVideoIds", () => {
  it("ページングを正しく辿る", async () => {
    const client = mockClient([
      {
        items: [
          {
            contentDetails: { videoId: "v1", videoPublishedAt: "2026-05-01T00:00:00Z" },
          },
          {
            contentDetails: { videoId: "v2", videoPublishedAt: "2026-04-30T00:00:00Z" },
          },
        ],
        nextPageToken: "page2",
      },
      {
        items: [
          {
            contentDetails: { videoId: "v3", videoPublishedAt: "2026-04-29T00:00:00Z" },
          },
        ],
      },
    ]);
    const { videoIds, quotaSpent } = await fetchUploadVideoIds("UU123", client);
    expect(videoIds).toEqual(["v1", "v2", "v3"]);
    expect(quotaSpent).toBe(2);
  });

  it("cutoffDate より古い動画を見つけたら打ち切り", async () => {
    const cutoff = new Date("2026-05-15T00:00:00Z");
    const client = mockClient([
      {
        items: [
          {
            contentDetails: { videoId: "v1", videoPublishedAt: "2026-05-20T00:00:00Z" },
          },
          {
            contentDetails: { videoId: "v2", videoPublishedAt: "2026-05-10T00:00:00Z" }, // < cutoff
          },
        ],
        nextPageToken: "page2",
      },
    ]);
    const { videoIds, quotaSpent } = await fetchUploadVideoIds("UU123", client, {
      cutoffDate: cutoff,
    });
    expect(videoIds).toEqual(["v1"]);
    expect(quotaSpent).toBe(1); // 2 ページ目は呼ばれない
  });

  it("maxVideoIds で停止する", async () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      contentDetails: { videoId: `v${i}`, videoPublishedAt: "2026-05-20T00:00:00Z" },
    }));
    const client = mockClient([{ items }]);
    const { videoIds } = await fetchUploadVideoIds("UU123", client, {
      maxVideoIds: 3,
    });
    expect(videoIds).toEqual(["v0", "v1", "v2"]);
  });
});

describe("fetchVideoDetails", () => {
  it("空配列なら API 呼ばずに空を返す", async () => {
    const client = mockClient([]);
    const { videos, quotaSpent } = await fetchVideoDetails([], client);
    expect(videos).toEqual([]);
    expect(quotaSpent).toBe(0);
  });

  it("動画詳細を VideoEntry に整形する", async () => {
    const client = mockClient([
      {
        items: [
          {
            id: "v1",
            snippet: {
              publishedAt: "2026-05-20T00:00:00Z",
              title: "Test Video",
              thumbnails: { high: { url: "https://thumb/v1.jpg" } },
              channelId: "UC123",
              channelTitle: "Test Channel",
            },
            statistics: { viewCount: "1000", likeCount: "100", commentCount: "10" },
            contentDetails: { duration: "PT4M30S" },
          },
        ],
      },
    ]);
    const { videos, quotaSpent } = await fetchVideoDetails(["v1"], client);
    expect(videos).toHaveLength(1);
    expect(videos[0].title).toBe("Test Video");
    expect(videos[0].viewCount).toBe(1000);
    expect(videos[0].likeCount).toBe(100);
    expect(videos[0].durationSec).toBe(270);
    expect(videos[0].isShort).toBe(false);
    expect(quotaSpent).toBe(1);
  });

  it("50 件超は複数バッチで取得", async () => {
    const makeItems = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        id: `v${i}`,
        snippet: {
          publishedAt: "2026-05-20T00:00:00Z",
          title: `V${i}`,
          channelId: "UC",
          channelTitle: "X",
        },
        statistics: { viewCount: "10" },
        contentDetails: { duration: "PT1M" },
      }));
    const client = mockClient([
      { items: makeItems(50) },
      { items: makeItems(20) },
    ]);
    const ids = Array.from({ length: 70 }, (_, i) => `v${i}`);
    const { quotaSpent } = await fetchVideoDetails(ids, client);
    expect(quotaSpent).toBe(2);
  });
});

describe("fetchChannelData (orchestrator)", () => {
  it("3 API 呼び出しを統合し、期間内動画を降順で返す", async () => {
    const client = mockClient([
      // channels.list
      {
        items: [
          {
            id: "UC1",
            snippet: { title: "Ch", publishedAt: "2020-01-01T00:00:00Z" },
            statistics: { viewCount: "100", subscriberCount: "10", videoCount: "2" },
            contentDetails: { relatedPlaylists: { uploads: "UU1" } },
          },
        ],
      },
      // playlistItems.list (page1)
      {
        items: [
          { contentDetails: { videoId: "v1", videoPublishedAt: "2026-05-20T00:00:00Z" } },
          { contentDetails: { videoId: "v2", videoPublishedAt: "2026-05-10T00:00:00Z" } },
        ],
      },
      // videos.list
      {
        items: [
          {
            id: "v1",
            snippet: {
              publishedAt: "2026-05-20T00:00:00Z",
              title: "V1",
              channelId: "UC1",
              channelTitle: "Ch",
            },
            statistics: { viewCount: "100" },
            contentDetails: { duration: "PT2M" },
          },
          {
            id: "v2",
            snippet: {
              publishedAt: "2026-05-10T00:00:00Z",
              title: "V2",
              channelId: "UC1",
              channelTitle: "Ch",
            },
            statistics: { viewCount: "50" },
            contentDetails: { duration: "PT3M" },
          },
        ],
      },
    ]);
    const result = await fetchChannelData("UC1", client, { period: "all" });
    expect(result.meta.title).toBe("Ch");
    expect(result.videos).toHaveLength(2);
    expect(result.videos[0].videoId).toBe("v1"); // 公開日降順
    expect(result.videos[1].videoId).toBe("v2");
    expect(result.quotaSpent).toBe(3); // 1 + 1 + 1
  });
});
