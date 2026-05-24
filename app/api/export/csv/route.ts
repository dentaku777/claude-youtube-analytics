import { NextRequest, NextResponse } from "next/server";
import { ApiProvider } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { hasApiKey } from "@/lib/api-keys/vault";
import { analyzeChannel } from "@/app/_actions/analyze";
import { compareChannels } from "@/app/_actions/compare";
import { buildCsv, type ExportRow } from "@/lib/csv/builder";
import type { Period } from "@/lib/youtube/api/fetcher";
import type { VideoTypeFilter } from "@/app/_actions/analyze";

/**
 * CSV エクスポート (F-EXPORT-01,02)
 * GET /api/export/csv?type=search&input=...&period=3m&videoType=all
 * GET /api/export/csv?type=compare&inputs=a,b,c&period=3m
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

  let rows: ExportRow[] = [];
  let filename = "videos";

  if (type === "compare") {
    const inputs = (url.searchParams.get("inputs") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (inputs.length === 0) {
      return NextResponse.json({ error: "inputs が空です" }, { status: 400 });
    }
    const { results } = await compareChannels({ inputs, period, videoType });
    rows = results.flatMap((r) =>
      r.ok
        ? r.videos.map<ExportRow>((v) => ({
            ...v,
            channelTitle: r.channelMeta.title,
          }))
        : [],
    );
    filename = `compare_${inputs.length}ch_${period}`;
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
    rows = result.videos.map<ExportRow>((v) => ({
      ...v,
      channelTitle: result.channelMeta.title,
    }));
    filename = `${result.channelMeta.title.replace(/[\\\/:*?"<>|]/g, "_")}_${period}`;
  }

  const csv = buildCsv(rows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
