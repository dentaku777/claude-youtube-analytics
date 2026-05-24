import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_HIT_THRESHOLD,
  DEFAULT_PAGE_SIZE,
  DEFAULT_VISIBLE_COLUMNS,
  parseHitThreshold,
  parsePageSize,
  parseVisibleColumns,
  type PageSize,
  type VideoColumnId,
} from "./columns";

export interface NormalizedPreference {
  visibleColumns: VideoColumnId[];
  pageSize: PageSize;
  hitThreshold: number;
  theme: string;
}

/**
 * 現在ユーザーの UserPreference を取得。存在しなければデフォルトで作成。
 * 旧アカウントなど preference 未生成のケースに備えて upsert で安全側に倒す。
 */
export async function getUserPreference(
  userId: string,
): Promise<NormalizedPreference> {
  const pref = await prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      visibleColumns: DEFAULT_VISIBLE_COLUMNS as unknown as Prisma.InputJsonValue,
      pageSize: DEFAULT_PAGE_SIZE,
      hitThreshold: DEFAULT_HIT_THRESHOLD,
    },
    update: {},
  });

  return {
    visibleColumns: parseVisibleColumns(pref.visibleColumns),
    pageSize: parsePageSize(pref.pageSize),
    hitThreshold: parseHitThreshold(pref.hitThreshold),
    theme: pref.theme,
  };
}
