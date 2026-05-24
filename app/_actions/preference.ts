"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import {
  DEFAULT_HIT_THRESHOLD,
  DEFAULT_PAGE_SIZE,
  DEFAULT_VISIBLE_COLUMNS,
  PAGE_SIZE_OPTIONS,
  VIDEO_COLUMNS,
  type VideoColumnId,
} from "@/lib/preference/columns";

export interface PreferenceActionResult {
  ok: boolean;
  message?: string;
}

const ALL_COLUMN_IDS = VIDEO_COLUMNS.map((c) => c.id) as [
  VideoColumnId,
  ...VideoColumnId[],
];

const schema = z.object({
  visibleColumns: z
    .array(z.enum(ALL_COLUMN_IDS))
    .min(1, "少なくとも 1 列を選択してください")
    .max(VIDEO_COLUMNS.length),
  pageSize: z
    .number()
    .int()
    .refine((n) => (PAGE_SIZE_OPTIONS as readonly number[]).includes(n), {
      message: "表示件数は 25 / 50 / 100 / 200 のいずれかを指定してください",
    }),
  hitThreshold: z
    .number()
    .min(1, "勝ち動画閾値は 1% 以上")
    .max(1000, "勝ち動画閾値は 1000% 以下"),
});

export async function updatePreference(
  input: unknown,
): Promise<PreferenceActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "入力が無効です",
    };
  }

  const user = await requireUser();
  const { visibleColumns, pageSize, hitThreshold } = parsed.data;

  await prisma.userPreference.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      visibleColumns: visibleColumns as unknown as Prisma.InputJsonValue,
      pageSize,
      hitThreshold,
    },
    update: {
      visibleColumns: visibleColumns as unknown as Prisma.InputJsonValue,
      pageSize,
      hitThreshold,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/search");
  return { ok: true, message: "保存しました" };
}

/** UI 側のリセットボタン用 (デフォルトに戻す) */
export async function resetPreference(): Promise<PreferenceActionResult> {
  const user = await requireUser();
  await prisma.userPreference.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      visibleColumns: DEFAULT_VISIBLE_COLUMNS as unknown as Prisma.InputJsonValue,
      pageSize: DEFAULT_PAGE_SIZE,
      hitThreshold: DEFAULT_HIT_THRESHOLD,
    },
    update: {
      visibleColumns: DEFAULT_VISIBLE_COLUMNS as unknown as Prisma.InputJsonValue,
      pageSize: DEFAULT_PAGE_SIZE,
      hitThreshold: DEFAULT_HIT_THRESHOLD,
    },
  });
  revalidatePath("/settings");
  revalidatePath("/search");
  return { ok: true, message: "デフォルトに戻しました" };
}
