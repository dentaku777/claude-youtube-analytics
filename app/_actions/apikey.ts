"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { encrypt, decrypt } from "@/lib/crypto/aes-gcm";
import { testYouTubeApiKey } from "@/lib/youtube/test-key";
import { recordQuota } from "@/lib/youtube/quota-tracker";
import { QUOTA_COST } from "@/lib/youtube/quota-cost";

export interface ApiKeyResult {
  ok: boolean;
  message?: string;
  verified?: boolean;
}

// ─── プロバイダ別の入力バリデーション ───
const formatRules: Record<ApiProvider, { pattern: RegExp; hint: string }> = {
  YOUTUBE: {
    pattern: /^AIzaSy[A-Za-z0-9_-]{33}$/,
    hint: "AIzaSy で始まる 39 文字",
  },
  OPENAI: {
    pattern: /^sk-[A-Za-z0-9_-]{20,}$/,
    hint: "sk- で始まる文字列",
  },
  ANTHROPIC: {
    pattern: /^sk-ant-[A-Za-z0-9_-]{20,}$/,
    hint: "sk-ant- で始まる文字列",
  },
  GOOGLE_AI: {
    pattern: /^AIzaSy[A-Za-z0-9_-]{33}$/,
    hint: "AIzaSy で始まる 39 文字 (YouTube とは別のキー)",
  },
};

// ─── Save (Create or Update) ───
const saveSchema = z.object({
  provider: z.enum(["YOUTUBE", "OPENAI", "ANTHROPIC", "GOOGLE_AI"]),
  apiKey: z.string().min(1, "API キーを入力してください"),
});

export async function saveApiKey(input: unknown): Promise<ApiKeyResult> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "入力が無効です" };
  }
  const user = await requireUser();
  const { provider, apiKey } = parsed.data;
  const trimmed = apiKey.trim();

  const rule = formatRules[provider];
  if (!rule.pattern.test(trimmed)) {
    return {
      ok: false,
      message: `キーの形式が正しくありません (${rule.hint})`,
    };
  }

  // YouTube だけ実 API を叩いて疎通確認 (F-KEY-02)
  let verified = false;
  if (provider === "YOUTUBE") {
    const test = await testYouTubeApiKey(trimmed);
    if (!test.ok) {
      return { ok: false, message: `疎通テスト失敗: ${test.message}` };
    }
    verified = true;
    await recordQuota(user.id, QUOTA_COST.CHANNELS_LIST);
  } else {
    // AI 系は MVP では疎通テストをスキップ (F-KEY-13/15)。
    verified = false;
  }

  const payload = encrypt(trimmed);

  await prisma.encryptedApiKey.upsert({
    where: { userId_provider: { userId: user.id, provider } },
    create: {
      userId: user.id,
      provider,
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      authTag: payload.authTag,
      lastVerifiedAt: verified ? new Date() : null,
    },
    update: {
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      authTag: payload.authTag,
      lastVerifiedAt: verified ? new Date() : null,
    },
  });

  revalidatePath("/settings");
  return {
    ok: true,
    verified,
    message: verified ? "保存しました (疎通確認済み)" : "保存しました",
  };
}

// ─── Delete ───
const deleteSchema = z.object({
  provider: z.enum(["YOUTUBE", "OPENAI", "ANTHROPIC", "GOOGLE_AI"]),
});

export async function deleteApiKey(input: unknown): Promise<ApiKeyResult> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "入力が無効です" };
  const user = await requireUser();
  const { provider } = parsed.data;

  await prisma.encryptedApiKey.delete({
    where: { userId_provider: { userId: user.id, provider } },
  });

  revalidatePath("/settings");
  return { ok: true, message: "削除しました" };
}

// ─── Test (再疎通確認) ───
export async function testApiKey(input: unknown): Promise<ApiKeyResult> {
  const parsed = deleteSchema.safeParse(input); // 同じ shape
  if (!parsed.success) return { ok: false, message: "入力が無効です" };
  const user = await requireUser();
  const { provider } = parsed.data;

  if (provider !== "YOUTUBE") {
    return { ok: false, message: "AI 系プロバイダの疎通テストは Phase 2 では未実装" };
  }

  const record = await prisma.encryptedApiKey.findUnique({
    where: { userId_provider: { userId: user.id, provider } },
  });
  if (!record) return { ok: false, message: "キーが登録されていません" };

  const apiKey = decrypt({
    ciphertext: record.ciphertext,
    iv: record.iv,
    authTag: record.authTag,
  });

  const result = await testYouTubeApiKey(apiKey);
  if (result.ok) {
    await prisma.encryptedApiKey.update({
      where: { userId_provider: { userId: user.id, provider } },
      data: { lastVerifiedAt: new Date() },
    });
    await recordQuota(user.id, QUOTA_COST.CHANNELS_LIST);
    revalidatePath("/settings");
    return { ok: true, verified: true, message: "疎通成功" };
  }
  return { ok: false, message: result.message };
}

// ─── 復号 (内部用、Server Action からのみ呼び出し) ───
export async function getDecryptedApiKey(
  provider: ApiProvider,
): Promise<string | null> {
  const user = await requireUser();
  const record = await prisma.encryptedApiKey.findUnique({
    where: { userId_provider: { userId: user.id, provider } },
  });
  if (!record) return null;
  return decrypt({
    ciphertext: record.ciphertext,
    iv: record.iv,
    authTag: record.authTag,
  });
}
