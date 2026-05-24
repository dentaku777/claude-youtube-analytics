import type { AggregatedVideo } from "./aggregate";

/**
 * 投稿時間ヒートマップ (F-INSIGHT-11)
 * 7 日 × 24 時 (JST) のグリッドに動画を集計する。
 */

export interface HeatmapCell {
  day: number; // 0..6 (日..土)
  hour: number; // 0..23
  postCount: number;
  totalViews: number;
  avgSpread: number | null; // 平均伸び率
}

export interface HeatmapResult {
  cells: HeatmapCell[]; // 168 セル
  maxPostCount: number;
  maxAvgSpread: number;
}

export function buildPostingHeatmap(videos: AggregatedVideo[]): HeatmapResult {
  // JST = UTC+9
  const grid: Record<string, { count: number; views: number; spreadSum: number; spreadN: number }> = {};
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      grid[`${d}-${h}`] = { count: 0, views: 0, spreadSum: 0, spreadN: 0 };
    }
  }

  for (const v of videos) {
    const jst = new Date(v.publishedAt.getTime() + 9 * 60 * 60 * 1000);
    const day = jst.getUTCDay();
    const hour = jst.getUTCHours();
    const cell = grid[`${day}-${hour}`];
    cell.count++;
    cell.views += v.viewCount;
    if (v.spreadRate !== null) {
      cell.spreadSum += v.spreadRate;
      cell.spreadN++;
    }
  }

  const cells: HeatmapCell[] = [];
  let maxPostCount = 0;
  let maxAvgSpread = 0;
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const c = grid[`${d}-${h}`];
      const avgSpread = c.spreadN > 0 ? c.spreadSum / c.spreadN : null;
      cells.push({
        day: d,
        hour: h,
        postCount: c.count,
        totalViews: c.views,
        avgSpread,
      });
      if (c.count > maxPostCount) maxPostCount = c.count;
      if (avgSpread !== null && avgSpread > maxAvgSpread) maxAvgSpread = avgSpread;
    }
  }

  return { cells, maxPostCount, maxAvgSpread };
}
