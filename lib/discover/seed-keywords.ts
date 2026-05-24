import path from "node:path";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import type { VideoEntry } from "@/lib/youtube/types";

/**
 * シードチャンネルの直近動画タイトルから探索キーワードを抽出 (F-DISCOVER-03)
 */

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji
        .builder({
          dicPath: path.join(process.cwd(), "node_modules/kuromoji/dict"),
        })
        .build((err, tokenizer) => {
          if (err) reject(err);
          else resolve(tokenizer);
        });
    });
  }
  return tokenizerPromise;
}

const STOP = new Set([
  "こと", "もの", "それ", "ため", "よう", "とき", "うち", "わけ",
  "私", "僕", "今日", "今回", "動画", "the", "of", "to", "a", "an",
]);

export async function extractSeedKeywords(
  videos: VideoEntry[],
  topN = 5,
): Promise<string[]> {
  if (videos.length === 0) return [];
  const tk = await getTokenizer();
  const counts = new Map<string, number>();

  for (const v of videos) {
    const tokens = tk.tokenize(v.title);
    const seen = new Set<string>();
    for (const t of tokens) {
      if (
        t.pos === "名詞" &&
        (t.pos_detail_1 === "一般" || t.pos_detail_1 === "固有名詞" || t.pos_detail_1 === "サ変接続")
      ) {
        const w = (t.basic_form && t.basic_form !== "*" ? t.basic_form : t.surface_form).toLowerCase();
        if (w.length < 2 || STOP.has(w) || /^\d+$/.test(w)) continue;
        if (!seen.has(w)) {
          counts.set(w, (counts.get(w) ?? 0) + 1);
          seen.add(w);
        }
      }
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([w]) => w);
}
