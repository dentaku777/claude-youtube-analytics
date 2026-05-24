import type { ApiProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto/aes-gcm";

/**
 * ユーザーが指定プロバイダの API キーを登録しているか確認する。
 * 鍵自体は返さない (チェック用)。
 */
export async function hasApiKey(
  userId: string,
  provider: ApiProvider,
): Promise<boolean> {
  const count = await prisma.encryptedApiKey.count({
    where: { userId, provider },
  });
  return count > 0;
}

/**
 * 復号した API キー文字列を返す。未登録なら null。
 * ⚠️ 必ず Server Action / Server Component / Route Handler 内でのみ呼ぶこと。
 * 返り値をクライアントに渡してはならない (CLAUDE.md セキュリティ原則)。
 */
export async function getApiKey(
  userId: string,
  provider: ApiProvider,
): Promise<string | null> {
  const record = await prisma.encryptedApiKey.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!record) return null;
  try {
    return decrypt({
      ciphertext: record.ciphertext,
      iv: record.iv,
      authTag: record.authTag,
    });
  } catch {
    return null;
  }
}
