import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "Youtube Analyzer のプライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold text-foreground">
        プライバシーポリシー
      </h1>
      <p className="text-xs text-muted-foreground">最終更新: 2026-05-25</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">1. 取得する情報</h2>
        <ul className="ml-5 list-disc space-y-1">
          <li>アカウント情報: メールアドレス、ハッシュ化されたパスワード、表示名</li>
          <li>Google OAuth 利用時: Google アカウントの公開プロフィール情報</li>
          <li>
            ユーザーが登録した API キー (YouTube Data API / OpenAI / Anthropic /
            Google Generative AI):
            <strong> サーバー側で AES-256-GCM 暗号化し DB に暗号文のみ保存。クライアントには返却しません。</strong>
          </li>
          <li>分析操作のメタデータ (検索履歴、Watchlist、Quota 消費記録)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. 利用目的</h2>
        <ul className="ml-5 list-disc space-y-1">
          <li>本サービスの提供 (認証、分析機能、ユーザー設定保存)</li>
          <li>不正利用の検知・防止</li>
          <li>サービス改善のための集計分析 (個人特定不可形式)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">3. 第三者提供</h2>
        <p>
          法令に基づく場合を除き、第三者にユーザーの個人情報を提供することはありません。
          API キーは外部に共有せず、ユーザー自身の YouTube / 生成 AI API
          への問い合わせのみに使用します。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">4. データ保管</h2>
        <ul className="ml-5 list-disc space-y-1">
          <li>データベース: Neon (PostgreSQL) — Singapore (ap-southeast-1)</li>
          <li>API キー暗号化: AES-256-GCM、暗号化鍵はサーバー環境変数のみで保管</li>
          <li>パスワード: bcrypt (cost 12) でハッシュ化</li>
          <li>セッション: NextAuth.js v5、JWT、Secure Cookie、有効期限 30 日</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. ユーザーの権利</h2>
        <p>
          ユーザーはいつでも自身のアカウントを削除でき、削除時には関連するすべての
          データ (API キー暗号文・履歴・Watchlist) が物理削除されます。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">6. Cookie 利用</h2>
        <p>
          認証セッション維持のみに Cookie を使用します。広告・トラッキング目的の
          Cookie は使用しません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">7. 改定</h2>
        <p>
          本ポリシーは予告なく改定される場合があります。改定後の継続利用をもって
          同意とみなします。
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        ⚠ 本テキストはドラフトです。本番公開前に法務担当者によるレビューを推奨します。
      </p>
    </div>
  );
}
