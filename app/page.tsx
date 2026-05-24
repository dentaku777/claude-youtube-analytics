export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="font-mono text-5xl font-bold tracking-tight text-lime-400">
          Youtube Analyzer
        </h1>
        <p className="mt-6 text-lg text-zinc-300">
          新規動画クリエイター向け YouTube 市場分析ツール
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Phase 1 基盤構築中 — 認証システム実装後にダッシュボードが利用可能になります
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <a
            href="/login"
            className="rounded-md bg-lime-400 px-6 py-3 font-medium text-zinc-950 transition hover:bg-lime-300"
          >
            ログイン
          </a>
          <a
            href="/signup"
            className="rounded-md border border-zinc-700 px-6 py-3 font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            サインアップ
          </a>
        </div>
      </div>
    </main>
  );
}
