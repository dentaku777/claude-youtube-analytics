import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { decrypt } from "@/lib/crypto/aes-gcm";
import { maskApiKey } from "@/lib/crypto/mask";
import { getUserPreference } from "@/lib/preference/get";
import { YouTubeKeyCard } from "./_components/YouTubeKeyCard";
import { AiKeyCard } from "./_components/AiKeyCard";
import { AccountSection } from "./_components/AccountSection";
import { PreferenceSection } from "./_components/PreferenceSection";

export const metadata: Metadata = { title: "Settings" };

interface KeyState {
  registered: boolean;
  masked: string | null;
  lastVerifiedAt: Date | null;
}

const NONE: KeyState = { registered: false, masked: null, lastVerifiedAt: null };

export default async function SettingsPage() {
  const user = await requireUser();

  // ユーザーの全 API キー + アカウント情報 + 表示設定を取得
  const [apiKeys, userRecord, preference] = await Promise.all([
    prisma.encryptedApiKey.findMany({ where: { userId: user.id } }),
    prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    getUserPreference(user.id),
  ]);

  // プロバイダ別に整形 (鍵は server-side でのみ復号 → マスク化)
  const states: Record<string, KeyState> = {};
  for (const k of apiKeys) {
    try {
      const plain = decrypt({
        ciphertext: k.ciphertext,
        iv: k.iv,
        authTag: k.authTag,
      });
      states[k.provider] = {
        registered: true,
        masked: maskApiKey(plain),
        lastVerifiedAt: k.lastVerifiedAt,
      };
    } catch {
      // 復号失敗 (ENCRYPTION_KEY 変更等)
      states[k.provider] = {
        registered: true,
        masked: "(復号失敗)",
        lastVerifiedAt: k.lastVerifiedAt,
      };
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          API キーの管理 (サーバー側で AES-256-GCM 暗号化保存)
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          YouTube Data API キー (分析に必須)
        </h2>
        <YouTubeKeyCard
          registered={states.YOUTUBE?.registered ?? false}
          masked={states.YOUTUBE?.masked ?? null}
          lastVerifiedAt={states.YOUTUBE?.lastVerifiedAt ?? null}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          生成 AI API キー (Phase 2 後半で使用予定)
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <AiKeyCard
            provider="OPENAI"
            registered={states.OPENAI?.registered ?? false}
            masked={states.OPENAI?.masked ?? null}
          />
          <AiKeyCard
            provider="ANTHROPIC"
            registered={states.ANTHROPIC?.registered ?? false}
            masked={states.ANTHROPIC?.masked ?? null}
          />
          <AiKeyCard
            provider="GOOGLE_AI"
            registered={states.GOOGLE_AI?.registered ?? false}
            masked={states.GOOGLE_AI?.masked ?? null}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          表示設定
        </h2>
        <PreferenceSection
          initialVisibleColumns={preference.visibleColumns}
          initialPageSize={preference.pageSize}
          initialHitThreshold={preference.hitThreshold}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          アカウント
        </h2>
        <AccountSection
          email={userRecord.email}
          name={userRecord.name}
          createdAt={userRecord.createdAt}
        />
      </section>
    </div>
  );
}

// _ keep unused suppressed
void NONE;
