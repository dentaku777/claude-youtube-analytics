import JSZip from "jszip";

export interface ThumbnailEntry {
  videoId: string;
  title: string;
  thumbnailUrl?: string;
}

/**
 * サムネ ZIP を生成する (F-EXPORT-03)。
 * 並列フェッチで失敗したエントリはスキップ。
 * 戻り値は Buffer (NextResponse.body にそのまま渡せる)。
 */
export async function buildThumbnailZip(
  entries: ThumbnailEntry[],
): Promise<Buffer> {
  const zip = new JSZip();

  // タイトル衝突対策のため videoId をプレフィクスに
  const tasks = entries
    .filter((e) => !!e.thumbnailUrl)
    .map(async (e) => {
      try {
        const res = await fetch(e.thumbnailUrl!, { cache: "no-store" });
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        // 拡張子は URL 末尾から判定 (yt は jpg がほとんど)
        const ext = guessExt(e.thumbnailUrl!);
        const safeTitle = sanitizeFilename(e.title).slice(0, 80);
        const filename = `${e.videoId}_${safeTitle}.${ext}`;
        zip.file(filename, Buffer.from(buf));
      } catch {
        // 1 件失敗は無視
      }
    });

  await Promise.all(tasks);

  return zip.generateAsync({ type: "nodebuffer", compression: "STORE" });
}

function guessExt(url: string): string {
  const m = url.match(/\.([a-zA-Z]{3,4})(?:\?|$)/);
  if (!m) return "jpg";
  const ext = m[1].toLowerCase();
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return ext;
  return "jpg";
}

function sanitizeFilename(s: string): string {
  return s.replace(/[\\\/:*?"<>|\x00-\x1F]/g, "_").trim() || "video";
}
