import { describe, it, expect, vi } from "vitest";
import { resolveChannelId } from "@/lib/youtube/api/resolver";
import type { YouTubeClient } from "@/lib/youtube/api/client";
import { YouTubeApiError } from "@/lib/youtube/api/errors";

function mockClient(
  response: unknown,
): { client: YouTubeClient; getSpy: ReturnType<typeof vi.fn> } {
  const getSpy = vi.fn().mockResolvedValue(response);
  const client: YouTubeClient = { get: getSpy };
  return { client, getSpy };
}

describe("resolveChannelId", () => {
  it("UC ID 直接入力は API 呼び出しなしで返す", async () => {
    const { client, getSpy } = mockClient({});
    const result = await resolveChannelId(
      "UCBR8-60-B28hp2BmDPdntcQ",
      client,
    );
    expect(result.channelId).toBe("UCBR8-60-B28hp2BmDPdntcQ");
    expect(result.quotaSpent).toBe(0);
    expect(getSpy).not.toHaveBeenCalled();
  });

  it("/channel/UC... URL から ID を抽出する (API 呼び出しなし)", async () => {
    const { client, getSpy } = mockClient({});
    const result = await resolveChannelId(
      "https://www.youtube.com/channel/UCBR8-60-B28hp2BmDPdntcQ",
      client,
    );
    expect(result.channelId).toBe("UCBR8-60-B28hp2BmDPdntcQ");
    expect(result.quotaSpent).toBe(0);
    expect(getSpy).not.toHaveBeenCalled();
  });

  it("@handle URL から API 経由で解決する (quota 1 消費)", async () => {
    const { client, getSpy } = mockClient({
      items: [{ id: "UCBR8-60-B28hp2BmDPdntcQ" }],
    });
    const result = await resolveChannelId(
      "https://www.youtube.com/@youtube",
      client,
    );
    expect(result.channelId).toBe("UCBR8-60-B28hp2BmDPdntcQ");
    expect(result.quotaSpent).toBe(1);
    expect(getSpy).toHaveBeenCalledWith("channels", {
      part: ["id"],
      forHandle: "@youtube",
      maxResults: 1,
    });
  });

  it("@handle 単体 (URL なし) でも解決する", async () => {
    const { client } = mockClient({
      items: [{ id: "UC1234567890123456789012" }],
    });
    const result = await resolveChannelId("@someuser", client);
    expect(result.channelId).toBe("UC1234567890123456789012");
  });

  it("/c/customname (旧 custom URL) も handle 経由で解決を試みる", async () => {
    const { client, getSpy } = mockClient({
      items: [{ id: "UC1234567890123456789012" }],
    });
    const result = await resolveChannelId(
      "https://youtube.com/c/customname",
      client,
    );
    expect(result.channelId).toBe("UC1234567890123456789012");
    expect(getSpy).toHaveBeenCalled();
  });

  it("空入力は BAD_REQUEST を投げる", async () => {
    const { client } = mockClient({});
    await expect(resolveChannelId("   ", client)).rejects.toThrow(
      YouTubeApiError,
    );
  });

  it("認識できない形式は BAD_REQUEST を投げる", async () => {
    const { client } = mockClient({});
    await expect(
      resolveChannelId("https://example.com/random", client),
    ).rejects.toThrow(YouTubeApiError);
  });

  it("ハンドル解決で API が空配列を返した場合は NOT_FOUND", async () => {
    const { client } = mockClient({ items: [] });
    await expect(resolveChannelId("@nonexistent", client)).rejects.toThrow(
      "ハンドル @nonexistent のチャンネルが見つかりません",
    );
  });

  it("前後の空白は無視する", async () => {
    const { client } = mockClient({});
    const result = await resolveChannelId(
      "   UCBR8-60-B28hp2BmDPdntcQ   ",
      client,
    );
    expect(result.channelId).toBe("UCBR8-60-B28hp2BmDPdntcQ");
  });
});
