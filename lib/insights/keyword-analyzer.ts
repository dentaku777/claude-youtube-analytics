import path from "node:path";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import type { AggregatedVideo } from "./aggregate";

/**
 * タイトル頻出語抽出 (F-INSIGHT-13)
 * kuromoji.js で形態素解析 → 名詞・固有名詞のみ抽出 → 頻度集計
 * 勝ち動画 (hits) と全動画で別々に集計し、ヒット度を計算
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

const STOP_WORDS = new Set([
  "the", "a", "an", "of", "to", "in", "and", "or", "for",
  "こと", "もの", "それ", "これ", "あれ", "よう", "ため", "そう",
  "ところ", "とき", "なか", "あと", "まま", "ほう", "わけ", "うち",
  "私", "僕", "俺", "君", "皆", "今日", "今回", "動画",
]);

const MIN_LEN = 2;

function extractNouns(text: string, tokenizer: Tokenizer<IpadicFeatures>): string[] {
  const tokens = tokenizer.tokenize(text);
  const nouns: string[] = [];
  for (const t of tokens) {
    // 名詞 (一般 / 固有名詞 / サ変接続) のみ
    if (
      t.pos === "名詞" &&
      (t.pos_detail_1 === "一般" || t.pos_detail_1 === "固有名詞" || t.pos_detail_1 === "サ変接続")
    ) {
      const w = (t.basic_form && t.basic_form !== "*" ? t.basic_form : t.surface_form).toLowerCase();
      if (w.length >= MIN_LEN && !STOP_WORDS.has(w) && !/^\d+$/.test(w)) {
        nouns.push(w);
      }
    }
  }
  return nouns;
}

export interface KeywordFreqRow {
  word: string;
  inHits: number;
  inAll: number;
  hitRate: number; // inHits / inAll (0..1)
  hitShare: number; // inHits / totalHits
}

export async function analyzeTitleKeywords(
  videos: AggregatedVideo[],
  hitThreshold = 100,
  topN = 30,
): Promise<KeywordFreqRow[]> {
  if (videos.length === 0) return [];

  const tokenizer = await getTokenizer();

  const hits = videos.filter(
    (v) => v.spreadRate !== null && v.spreadRate >= hitThreshold,
  );

  const allCounts = new Map<string, number>();
  const hitCounts = new Map<string, number>();

  for (const v of videos) {
    const nouns = new Set(extractNouns(v.title, tokenizer));
    for (const n of nouns) allCounts.set(n, (allCounts.get(n) ?? 0) + 1);
  }
  for (const v of hits) {
    const nouns = new Set(extractNouns(v.title, tokenizer));
    for (const n of nouns) hitCounts.set(n, (hitCounts.get(n) ?? 0) + 1);
  }

  const rows: KeywordFreqRow[] = [];
  for (const [word, all] of allCounts) {
    if (all < 2) continue; // ノイズ除去
    const inHits = hitCounts.get(word) ?? 0;
    if (inHits === 0) continue;
    rows.push({
      word,
      inHits,
      inAll: all,
      hitRate: inHits / all,
      hitShare: hits.length > 0 ? inHits / hits.length : 0,
    });
  }

  // hitShare 降順 + hitRate 降順
  rows.sort((a, b) => b.hitShare - a.hitShare || b.hitRate - a.hitRate);
  return rows.slice(0, topN);
}
