# Youtube Analyzer

**これから動画作成を始める方の市場分析を支援する** 認証付き Web アプリケーション。
「つべサーチ」(https://tube-search.xyz) を参考にしつつ、認証・サーバー側暗号化保存・Watchlist 中心の横断分析・生成 AI 連携基盤を追加。

リポジトリディレクトリ名: `claude-youtube-analytics`
プロダクト名: **Youtube Analyzer**

## プロジェクト概要

### 提供価値
「**どのニッチで、どんな動画を作れば勝てるか？**」を新規動画クリエイターが意思決定できるように、ベンチマーク（注視対象）チャンネル群を中心にした市場分析機能を提供する。

### ターゲットユーザー
- **これから YouTube 動画作成を始める方**
- 動画を始めたばかりで参入戦略を立てたい方
- 副次的に既存運営者の市場分析・競合観察にも対応

### 中心概念：Watchlist（ベンチマーク）
ユーザーが注視する競合・ベンチマーク的なチャンネル群を **Watchlist** として管理し、すべての分析機能が Watchlist を横断的に参照する設計とする。

### 主要機能（MVP）
- 単一チャンネル分析（`/search`）
- 最大 3 チャンネル比較（`/compare`）
- **Watchlist 管理（`/watchlist`）** — 最大 30 チャンネル
- **Insights ダッシュボード（`/insights`）** — Watchlist 横断分析
  - 勝ち動画パターン分析（伸び率 ≥ 100% の動画の共通点抽出）
  - 投稿時間ヒートマップ（曜日 × 時刻）
  - サムネギャラリー（高伸び率動画のサムネを並列表示）
  - タイトル頻出語分析（kuromoji 形態素解析）
  - 動画尺 × 伸び率分布
- **キーワード市場分析（`/keywords`）** — 検索キーワードの動画市場規模・競合数
- **競合チャンネル発見（`/discover`）** — 入力チャンネルと類似したチャンネル推薦
- CSV / ZIP エクスポート、検索履歴、表示カスタマイズ

### 差別化ポイント
- 認証付き（複数端末で同一設定）
- API キー（YouTube + 生成 AI）のサーバー側暗号化保存（AES-256-GCM）
- **Watchlist を中心とした横断的機能設計**
- URL を入れるだけで分析開始する UX
- オリジナルとは異なる「ダーク基調・データ密度高めのアナリティクス UI」

## 技術スタック

| 層 | 採用技術 |
|---|---|
| フロント | Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| 認証 | NextAuth.js v5 (Credentials + Google OAuth) |
| DB | Neon (PostgreSQL) + Prisma |
| 暗号化 | AES-256-GCM (Node.js `crypto`) |
| 形態素解析 | kuromoji.js（タイトル頻出語抽出） |
| 外部 API | YouTube Data API v3 /（将来）OpenAI / Anthropic / Google Generative AI |
| グラフ | Recharts（推移）/ visx or 自前 SVG（ヒートマップ） |
| ホスティング | Vercel |
| メール | Resend |
| テスト | Vitest（単体）+ Playwright（E2E） |

すべて無料枠で運用開始する前提。

## ドキュメント構成

| ファイル | 内容 |
|---|---|
| [CLAUDE.md](./CLAUDE.md) | 本ファイル。Claude Code への指示・概要 |
| [docs/01_project_definition.md](./docs/01_project_definition.md) | プロジェクト定義書（目的・スコープ・体制） |
| [docs/02_requirements.md](./docs/02_requirements.md) | 要件定義書（機能要件・非機能要件） |
| [docs/03_basic_design.md](./docs/03_basic_design.md) | 基本設計書（アーキテクチャ・DB・画面・API・横断データフロー） |
| [docs/SETUP.md](./docs/SETUP.md) | **Phase 0 セットアップガイド（ユーザー作業手順）** |
| [docs/WBS.xlsx](./docs/WBS.xlsx) | 全 74 タスクの WBS（Excel） |
| [99.reference/](./99.reference/) | 参照元オリジナル（マニュアル・FAQ） |

## ディレクトリ構造（予定）

```
claude-youtube-analytics/
├── CLAUDE.md
├── docs/                       # 設計ドキュメント
├── 99.reference/               # 参照資料
├── app/                        # Next.js App Router
│   ├── (auth)/                 # ログイン・サインアップ
│   ├── (app)/                  # 認証必須ページ
│   │   ├── search/             # 単一チャンネル分析
│   │   ├── compare/            # 比較
│   │   ├── watchlist/          # Watchlist 管理
│   │   ├── insights/           # 横断インサイト
│   │   ├── keywords/           # キーワード市場分析
│   │   ├── discover/           # 競合発見
│   │   ├── settings/           # API キー一括管理
│   │   └── history/
│   └── api/
├── components/                 # UI コンポーネント
├── lib/                        # ドメインロジック
│   ├── youtube/                # API ラッパー、KPI 計算
│   ├── insights/               # パターン抽出、ヒートマップ集計、頻出語
│   ├── ai/                     # 生成 AI 連携（フェーズ 2）
│   ├── crypto/                 # 暗号化
│   ├── csv/, zip/
│   └── cache/                  # Watchlist データキャッシュ
├── prisma/
└── tests/
```

## 開発ルール

### コーディング規約
- **言語**: TypeScript strict mode
- **フォーマッタ**: Prettier（デフォルト設定）
- **リンタ**: ESLint（Next.js 推奨 + `@typescript-eslint`）
- **import 順序**: ESLint `import/order` で自動整列
- **コンポーネント**: 1 ファイル 1 コンポーネント、PascalCase ファイル名
- **Server Actions**: `app/_actions/` 配下、`use server` ディレクティブ必須

### Git ルール
- **ブランチ命名**: `feature/<scope>-<short-desc>` / `fix/<scope>-<short-desc>`
- **コミットメッセージ**: Conventional Commits（`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`）
- **main へのマージ**: PR 必須

### セキュリティ原則
- YouTube API キー・生成 AI API キーはサーバー側でのみ復号する。クライアントへ返さない
- パスワードは bcrypt（cost 12）でハッシュ化
- すべての認証必須ページは Middleware で保護
- HTTPS 必須、Secure Cookie、SameSite=Lax

### 横断設計原則（重要）
- **すべての分析画面の動画一覧に「★ Watchlist に追加」ボタンを配置**
- Watchlist チャンネルのデータは `AnalysisCache` で共有し、画面間で再フェッチしない
- 検索 → 履歴 → Watchlist → Insights のデータ流れを途切れさせない

### 環境変数（Vercel に登録）
- `DATABASE_URL` — Neon の接続文字列
- `NEXTAUTH_SECRET` — NextAuth 用シークレット
- `NEXTAUTH_URL` — 本番 URL
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `ENCRYPTION_KEY` — API キー暗号化用（32 バイト、Base64）
- `RESEND_API_KEY` — メール送信用

## Claude Code への指示

- ドキュメントを更新する際は、関連する他ドキュメントとの整合性も確認すること
- 新規実装の前に `docs/03_basic_design.md` を参照し、設計逸脱がないか確認
- セキュリティに関わる変更（暗号化、認証、認可）は実装前に必ずユーザーに確認
- KPI 計算ロジックの変更時は `tests/lib/youtube/kpi.test.ts` を必ず更新
- パッケージ追加時は理由を PR 説明に明記
- デザイン変更時は **オリジナル「つべサーチ」とは異なる方向性**を維持（ダーク基調・データ密度高めのアナリティクス UI）
- **横断設計を意識**: 新機能は Watchlist / AnalysisCache を参照する形で実装し、孤立した機能は作らない
- **新規クリエイター視点**: UI 文言・ヘルプ・エラーメッセージは「これから動画を始める方」が理解できる平易さで
