import { NextRequest, NextResponse } from "next/server";
import { ApiProvider } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { hasApiKey } from "@/lib/api-keys/vault";
import { analyzeChannel } from "@/app/_actions/analyze";
import { compareChannels } from "@/app/_actions/compare";
import { buildThumbnailZip, type ThumbnailEntry } from "@/lib/zip/thumbnails";
import type { Period } from "@/lib/youtube/api/fetcher";
import type { VideoTypeFilter } from "@/app/_actions/analyze";

/**
 * サムネ ZIP エクスポート (F-EXPORT-03)
 * GET /api/export/zip?type=search&input=...&period=3m
 * GET /api/export/zip?type=compare&inputs=a,b,c&period=3m
 */
export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!(await hasApiKey(user.id, ApiProvider.YOUTUBE))) {
    return NextResponse.json(
      { error: "YouTube API キーが未登録です" },
      { status: 400 },
    );
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "search";
  const period = (url.searchParams.get("period") as Period) ?? "3m";
  const videoType =
    (url.searchParams.get("videoType") as VideoTypeFilter) ?? "all";

  let entries: ThumbnailEntry[] = [];
  let filename = "thumbnails";

  if (type === "compare") {
    const inputs = (url.searchParams.get("inputs") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (inputs.length === 0) {
      return NextResponse.json({ error: "inputs が空です" }, { status: 400 });
    }
    const { results } = await compareChannels({ inputs, period, videoType });
    entries = results.flatMap((r) => (r.ok ? r.videos : []));
    filename = `compare_${inputs.length}ch_${period}_thumbnails`;
  } else {
    const input = url.searchParams.get("input") ?? "";
    if (!input.trim()) {
      return NextResponse.json({ error: "input が空です" }, { status: 400 });
    }
    const result = await analyzeChannel({ input, period, videoType });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, code: result.code },
        { status: 400 },
      );
    }
    entries = result.videos;
    filename = `${result.channelMeta.title.replace(/[\\\/:*?"<>|]/g, "_")}_${period}_thumbnails`;
  }

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "対象動画がありません" },
      { status: 400 },
    );
  }

  const buf = await buildThumbnailZip(entries);
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
