/**
 * /search VideoTable の列定義と UserPreference.visibleColumns のヘルパ。
 * 要件: F-SEARCH-14 / F-SEARCH-15
 *
 * 列 ID は VideoTable と PreferenceSection の単一の出典 (single source of truth)。
 * required: true の列は常時表示 (トグル対象外)。
 */

export type VideoColumnId =
  | "thumbnail"
  | "title"
  | "publishedAt"
  | "duration"
  | "type"
  | "views"
  | "likes"
  | "comments"
  | "spread"
  | "link";

export interface VideoColumnMeta {
  id: VideoColumnId;
  label: string;
  required: boolean;
}

export const VIDEO_COLUMNS: readonly VideoColumnMeta[] = [
  { id: "thumbnail", label: "サムネ", required: true },
  { id: "title", label: "タイトル", required: true },
  { id: "publishedAt", label: "公開日", required: false },
  { id: "duration", label: "長さ", required: false },
  { id: "type", label: "タイプ (Shorts/通常)", required: false },
  { id: "views", label: "再生数", required: false },
  { id: "likes", label: "高評価", required: false },
  { id: "comments", label: "コメント", required: false },
  { id: "spread", label: "伸び率", required: false },
  { id: "link", label: "外部リンク", required: true },
];

/** トグル可能な列 (UI で選択肢として並べる) */
export const TOGGLEABLE_COLUMNS = VIDEO_COLUMNS.filter((c) => !c.required);

const ALL_IDS = new Set<VideoColumnId>(VIDEO_COLUMNS.map((c) => c.id));

/** 新規ユーザーのデフォルト表示列 (トグル可能列のうち主要 5 つ) */
export const DEFAULT_VISIBLE_COLUMNS: VideoColumnId[] = [
  "publishedAt",
  "duration",
  "type",
  "views",
  "spread",
];

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_PAGE_SIZE: PageSize = 50;
export const DEFAULT_HIT_THRESHOLD = 100;

/**
 * DB の Json 列から VideoColumnId[] を安全に取り出す。
 * 不正値や旧スキーマ値は弾き、空になればデフォルトを返す。
 */
export function parseVisibleColumns(raw: unknown): VideoColumnId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_VISIBLE_COLUMNS];
  const valid = raw.filter(
    (v): v is VideoColumnId => typeof v === "string" && ALL_IDS.has(v as VideoColumnId),
  );
  // 必須列以外がゼロ件ならデフォルトに戻す (誤って空保存しても破綻させない)
  const toggleableCount = valid.filter(
    (id) => !VIDEO_COLUMNS.find((c) => c.id === id)?.required,
  ).length;
  if (toggleableCount === 0) return [...DEFAULT_VISIBLE_COLUMNS];
  return valid;
}

export function parsePageSize(raw: unknown): PageSize {
  const n = typeof raw === "number" ? raw : Number(raw);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n)
    ? (n as PageSize)
    : DEFAULT_PAGE_SIZE;
}

export function parseHitThreshold(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 1000) return DEFAULT_HIT_THRESHOLD;
  return Math.round(n * 10) / 10; // 小数 1 桁まで
}
