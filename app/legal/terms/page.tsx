import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約",
  description: "Youtube Analyzer の利用規約",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold text-foreground">利用規約</h1>
      <p className="text-xs text-muted-foreground">最終更新: 2026-05-25</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">1. 適用範囲</h2>
        <p>
          本規約は Youtube Analyzer
          (以下「本サービス」)を利用するすべてのユーザーに適用されます。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. アカウント登録</h2>
        <ul className="ml-5 list-disc space-y-1">
          <li>1 人につき 1 アカウントの登録を認めます</li>
          <li>登録情報は正確かつ最新の状態に保ってください</li>
          <li>パスワードの管理責任はユーザーにあります</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">3. API キーの取り扱い (BYOK)</h2>
        <p>
          本サービスは YouTube Data API および生成 AI API を Bring Your Own Key
          方式で利用します。
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            API キーの発行・課金・利用上限管理はユーザー自身の責任で行ってください
          </li>
          <li>
            本サービスはユーザーが登録したキーを暗号化保管し、ユーザーの操作に応じてのみ利用します
          </li>
          <li>
            API プロバイダーの利用規約 (YouTube API Services Terms, OpenAI usage
            policy 等) を遵守してください
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">4. 禁止事項</h2>
        <ul className="ml-5 list-disc space-y-1">
          <li>他者の API キーの不正取得・利用</li>
          <li>本サービスを通じた大量データの自動取得・転売</li>
          <li>本サービスのリバースエンジニアリング</li>
          <li>法令・公序良俗に反する行為</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. 免責事項</h2>
        <p>
          本サービスは YouTube Data API
          の応答を加工して表示するもので、データの正確性・完全性を保証しません。
          本サービスの利用により生じたいかなる損害についても運営者は責任を負いません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">6. サービス変更・終了</h2>
        <p>
          運営者は予告なく本サービスの内容変更または終了ができるものとします。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">7. 準拠法・管轄</h2>
        <p>
          本規約は日本法に準拠し、本サービスに関する紛争は東京地方裁判所を専属的合意管轄とします。
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        ⚠ 本テキストはドラフトです。本番公開前に法務担当者によるレビューを推奨します。
      </p>
    </div>
  );
}
