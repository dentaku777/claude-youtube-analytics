import { prisma } from "@/lib/prisma";
import { DAILY_QUOTA_LIMIT } from "./quota-cost";

/**
 * YouTube API Quota の「日付キー」を返す。
 * 仕様: PST 0:00 = JST 17:00 = UTC 08:00 を境に切り替わる。
 * 例: UTC 07:59 → 前日扱い / UTC 08:00 → 当日扱い
 */
export function getQuotaDayKey(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() - 8 * 60 * 60 * 1000); // -8h
  return shifted.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/**
 * ユーザーの今日の Quota 消費に units を加算する。
 * race condition 対策に increment を使用 (PostgreSQL の atomic update)。
 */
export async function recordQuota(
  userId: string,
  units: number,
  now: Date = new Date(),
): Promise<void> {
  if (units <= 0) return;
  const date = getQuotaDayKey(now);

  await prisma.dailyQuota.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, units },
    update: { units: { increment: units } },
  });
}

export interface QuotaSnapshot {
  date: string;
  used: number;
  limit: number;
  remaining: number;
  ratio: number; // 0..1
}

/**
 * 今日の Quota 残量を返す。
 * 記録がない場合は used=0 として扱う。
 */
export async function getDailyQuota(
  userId: string,
  now: Date = new Date(),
): Promise<QuotaSnapshot> {
  const date = getQuotaDayKey(now);
  const record = await prisma.dailyQuota.findUnique({
    where: { userId_date: { userId, date } },
  });
  const used = record?.units ?? 0;
  const remaining = Math.max(0, DAILY_QUOTA_LIMIT - used);
  return {
    date,
    used,
    limit: DAILY_QUOTA_LIMIT,
    remaining,
    ratio: Math.min(1, used / DAILY_QUOTA_LIMIT),
  };
}
