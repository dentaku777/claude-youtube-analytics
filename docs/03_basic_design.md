# 03. 基本設計書

| 項目 | 内容 |
|---|---|
| プロダクト名 | Youtube Analyzer |
| 作成日 | 2026-05-24 |
| 最終更新 | 2026-05-24 |
| ステータス | ドラフト |
| 関連ドキュメント | [01_project_definition.md](./01_project_definition.md) / [02_requirements.md](./02_requirements.md) |

---

## 1. システムアーキテクチャ

### 1.1 全体構成図

```
┌────────────────────────────────────────────────────────────────────┐
│                           User (Browser)                            │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │              Next.js (Server Components + Client)          │     │
│  └────────────────────────────────────────────────────────────┘     │
└────────────────────────────────┬───────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                        Vercel (Edge + Lambda)                       │
│  ┌──────────────────┐  ┌────────────────┐  ┌──────────────────┐     │
│  │ Next.js App      │  │ Server Actions │  │ Middleware       │     │
│  │ Router (RSC)     │  │ (use server)   │  │ (Auth Guard)     │     │
│  └────────┬─────────┘  └────────┬───────┘  └──────────────────┘     │
└───────────┼─────────────────────┼─────────────────────────────────┘
            │                     │
   ┌────────┴────────┐    ┌───────┴─────────┐    ┌───────────────┐
   │ NextAuth.js     │    │ External API    │    │ Resend        │
   │ - Credentials   │    │ Clients         │    │ (メール送信)  │
   │ - Google OAuth  │    │ - YouTube v3    │    └───────────────┘
   │                 │    │ - OpenAI(将来) │
   │                 │    │ - Anthropic(将来)│
   │                 │    │ - GoogleAI(将来) │
   └────────┬────────┘    └────────┬────────┘
            │                      │
            ▼                      ▼
   ┌────────────────────────────────────────┐
   │ Neon (PostgreSQL) + Prisma             │
   │                                        │
   │ - User / Auth / Session                │
   │ - EncryptedApiKey                      │
   │ - Watchlist / WatchlistChannel         │
   │ - AnalysisCache (★横断データ層)         │
   │ - SearchHistory / AuditLog             │
   └────────────────────────────────────────┘
```

### 1.2 横断データフロー（Watchlist 中心の設計）

```
                  ┌────────────────────────────┐
                  │     Watchlist              │
                  │  (ユーザー単位、30ch上限)  │
                  └─────────────┬──────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
   ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────┐
   │  /search で追加   │ │ /compare で参照  │ │ /keywords / discover│
   │  「★追加」ボタン │ │ 「Watchlistから  │ │ から1クリック追加  │
   │                  │ │   選ぶ」モーダル │ │                    │
   └──────────────────┘ └──────────────────┘ └────────────────────┘
                                │
                                ▼
                  ┌────────────────────────────┐
                  │     AnalysisCache          │
                  │  channelId, period →       │
                  │  channel meta + videos     │
                  │  TTL: 1 時間                │
                  └─────────────┬──────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
   │  /search 再表示  │ │  /compare 並列   │ │  /insights 横断  │
   │  (Cache hit)     │ │  ロード加速      │ │  分析            │
   └──────────────────┘ └──────────────────┘ └──────────────────┘
```

**設計意図**:
- 同じチャンネルデータを **複数画面で再利用** することで Quota を節約
- Watchlist を中心とした「市場ポートフォリオ」をユーザーが育てる UX を実現
- Insights は AnalysisCache から純粋関数で集計 → 追加 API 呼び出しなし

### 1.3 レイヤ構成

```
[Presentation]   app/(auth), app/(app) - Server/Client Components, shadcn/ui
[Application]    app/_actions/ - Server Actions（ユースケース層）
[Domain]         lib/youtube/ (KPI), lib/insights/ (横断分析), lib/ai/ (将来)
[Infrastructure] prisma/ (DB), lib/youtube/client.ts (API), lib/cache/ (キャッシュ層)
```

### 1.4 設計原則
- **Server-First**: Server Components / Server Actions 優先
- **API キーは Server のみ**: 復号は Server Action 内のみ。クライアントへ平文を返さない
- **依存方向**: Presentation → Application → Domain
- **横断ファースト**: 新機能は Watchlist / AnalysisCache を参照する形で実装
- **Insights は純関数集計**: AnalysisCache のデータから副作用なく集計
- **Quota ガード**: search.list 系操作はすべて事前確認モーダル必須

---

## 2. デザインシステム / 画面設計

### 2.1 デザイン方針

| 要素 | Youtube Analyzer | つべサーチ（オリジナル） |
|---|---|---|
| ベースカラー | ニュートラルグレー (`zinc-950` / `zinc-100`) | ライトブルー基調 |
| アクセント | ライム/シアン (`lime-400`, `cyan-400`) | ブルー |
| デフォルトテーマ | **ダーク** | ライト |
| レイアウト | 左サイドバー固定 + データ密度高ダッシュボード | ヘッダー + センターカード並列 |
| 数値表現 | 等幅フォント + スパークライン埋め込み | プレーンテキスト |
| キー設定 UX | 設定画面で一括、検索画面はキー不要 | 検索画面で都度キー設定 |

### 2.2 カラーパレット（Tailwind 拡張）

```ts
theme: {
  extend: {
    colors: {
      bg:      { DEFAULT: '#09090b', elevated: '#18181b', muted: '#27272a' },
      fg:      { DEFAULT: '#fafafa', muted: '#a1a1aa',  subtle: '#71717a' },
      border:  { DEFAULT: '#27272a', strong: '#3f3f46' },
      accent:  { DEFAULT: '#a3e635', hover: '#bef264' },  // lime-400
      info:    { DEFAULT: '#22d3ee' },                    // cyan-400
      success: '#84cc16',
      warning: '#f59e0b',
      danger:  '#ef4444',
      spread:  { high: '#a3e635', mid: '#f59e0b', low: '#71717a' },
      // Insights ヒートマップ用
      heat:    { 0: '#27272a', 1: '#365314', 2: '#65a30d', 3: '#a3e635', 4: '#ecfccb' },
    },
    fontFamily: {
      sans: ['Inter', 'Geist Sans', 'system-ui'],
      mono: ['JetBrains Mono', 'Geist Mono', 'monospace'],
    },
  },
}
```

### 2.3 画面一覧

| ID | URL | 認証 | 概要 |
|---|---|---|---|
| P-001 | `/` | 任意 | ランディング |
| P-002 | `/login` | 不要 | ログイン |
| P-003 | `/signup` | 不要 | サインアップ |
| P-004 | `/verify-email` | 不要 | メール認証完了 |
| P-005 | `/reset-password` | 不要 | パスワードリセット要求 |
| P-006 | `/reset-password/[token]` | 不要 | パスワード再設定 |
| P-007 | `/search` | 必要 | 単一チャンネル分析 |
| P-008 | `/compare` | 必要 | 最大 3 チャンネル比較 |
| **P-011** | **`/watchlist`** | 必要 | **Watchlist 管理（最大 30 ch）** |
| **P-012** | **`/insights`** | 必要 | **横断インサイトダッシュボード** |
| **P-013** | **`/keywords`** | 必要 | **キーワード市場分析** |
| **P-014** | **`/discover`** | 必要 | **競合チャンネル発見** |
| P-009 | `/settings` | 必要 | API キー一括管理 + アカウント設定 |
| P-010 | `/history` | 必要 | 検索履歴 |

### 2.4 主要画面ワイヤー

#### P-011 `/watchlist` Watchlist 管理
```
┌─────────────────────────────────────────────────────────────┐
│  Watchlist  (12 / 30)        [+ Add Channel] [Refresh All]   │
├─────────────────────────────────────────────────────────────┤
│  Filter: [Tags: ガジェット ▼]   Sort: [Avg Spread ↓ ▼]      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────┬───────────────┬──────┬──────┬────────┬──────┬──┐    │
│  │ 📷  │ Channel       │ Subs │ Vids │ Spread │ Last │  │    │
│  ├─────┼───────────────┼──────┼──────┼────────┼──────┼──┤    │
│  │ ●   │ @xxx [ガジェ] │ 1.2M │ 487  │  45%   │ 2h   │⋯│    │
│  │ ●   │ @yyy [料理]   │ 320K │ 198  │  82%   │ 1d   │⋯│    │
│  │ ●   │ @zzz [ガジェ] │  85K │ 76   │ 130%   │ 3d   │⋯│    │
│  └─────┴───────────────┴──────┴──────┴────────┴──────┴──┘    │
│                                                              │
│  Selected: 3 chans → [Compare] [Insights] [Export CSV]       │
└─────────────────────────────────────────────────────────────┘
```

#### P-012 `/insights` 横断インサイト
```
┌─────────────────────────────────────────────────────────────┐
│  Insights                                                    │
│  Source: [Watchlist (12 ch) ▼]  Period: [3m ▼]              │
│  Filter: ☑ All ☐ ガジェット ☐ 料理                          │
├─────────────────────────────────────────────────────────────┤
│  Summary: 487 videos analyzed, 89 hits (≥100% spread)        │
├─────────────────────────────────────────────────────────────┤
│  🎯 勝ち動画パターン                                          │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Best weekday: Sat (32% of hits)                      │    │
│  │ Best hour:    20:00-22:00 JST                        │    │
│  │ Best length:  8-12 min (regular) / 30-45s (shorts)   │    │
│  │ Hit shorts ratio: 38% (vs 12% in non-hits)           │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  🔥 投稿時間ヒートマップ (色濃度 = hits 数)                  │
│      00 03 06 09 12 15 18 21                                 │
│  Mon ░  ░  ░  ▒  ▒  ▒  ▓  █                                 │
│  Tue ░  ░  ░  ░  ▒  ▒  ▓  ▓                                 │
│  ... (mode: hits / posts toggle)                             │
│                                                              │
│  🖼 サムネギャラリー (hits 上位 100)                          │
│  [📷][📷][📷][📷][📷][📷][📷][📷]                              │
│  [📷][📷][📷][📷][📷][📷][📷][📷] ...                          │
│                                                              │
│  📝 タイトル頻出語 (hits vs all)                              │
│  ┌──────────────┬────────────┬──────────┐                    │
│  │ Word         │ Hits freq  │ All freq │                    │
│  │ 開封         │     42     │    18    │ ▲ 2.3x             │
│  │ 最新         │     38     │    25    │ ▲ 1.5x             │
│  │ iPhone       │     31     │    12    │ ▲ 2.6x             │
│  └──────────────┴────────────┴──────────┘                    │
│                                                              │
│  📊 動画尺 × 伸び率 (散布図)                                  │
│  [Scatter plot: x=duration(min), y=spread(%), color=type]    │
└─────────────────────────────────────────────────────────────┘
```

#### P-013 `/keywords` キーワード市場分析
```
┌─────────────────────────────────────────────────────────────┐
│  Keyword Market Research              ⚠ Quota: 100 / search │
├─────────────────────────────────────────────────────────────┤
│  Keyword: [iPhone 16 レビュー___________________] [Search]   │
├─────────────────────────────────────────────────────────────┤
│  📈 Market Size                                              │
│   - Total views (top 50): 18.4M                              │
│   - Avg views/video:      368K                               │
│   - Top video:            2.1M views                         │
│                                                              │
│  🏆 Competition                                              │
│   - Unique channels: 27                                      │
│   - Top 5: @aaa (8 vids), @bbb (5), ...                      │
│   - [★ Add all top 5 to Watchlist]                           │
│                                                              │
│  📊 Spread distribution                                      │
│   [histogram: <30%: 8, 30-100%: 22, ≥100%: 20]               │
│                                                              │
│  📅 Publish timing                                           │
│   [bar chart: last 12 weeks]                                 │
└─────────────────────────────────────────────────────────────┘
```

#### P-014 `/discover` 競合チャンネル発見
```
┌─────────────────────────────────────────────────────────────┐
│  Discover Similar Channels              ⚠ Quota: ~200       │
├─────────────────────────────────────────────────────────────┤
│  Seed channel: [@xxx___________] [Find Similar]              │
├─────────────────────────────────────────────────────────────┤
│  Top keywords detected: 開封, iPhone, レビュー, 最新, おすすめ│
│                                                              │
│  Recommended channels (relevance score)                      │
│  ┌──────┬────────────┬──────┬──────┬───────┬──────────┐      │
│  │ 📷   │ Channel    │ Subs │ Vids │ Score │ Action   │      │
│  ├──────┼────────────┼──────┼──────┼───────┼──────────┤      │
│  │  ●   │ @aaa       │ 450K │ 234  │  92   │[★][Analyze]│    │
│  │  ●   │ @bbb       │ 280K │ 167  │  85   │[★][Analyze]│    │
│  │  ●   │ @ccc       │ 1.2M │ 521  │  78   │[★][Analyze]│    │
│  └──────┴────────────┴──────┴──────┴───────┴──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

#### サイドバー（PC）
```
┌──────────────┐
│ ▰▰▰ YOUTUBE  │
│   ANALYZER   │
├──────────────┤
│ ⌕ Search     │
│ ⇄ Compare    │
│ ☆ Watchlist  │  ← 中心エンティティ
│ 📊 Insights  │  ← 横断分析
│ 🔎 Keywords  │  ← 市場規模分析
│ 🧭 Discover  │  ← 競合発見
│ ⏱ History    │
│ ⚙ Settings   │
└──────────────┘
```

---

## 3. データモデル設計

### 3.1 ER 図

```
┌────────────┐      ┌──────────────────────┐
│   User     │ 1──* │ EncryptedApiKey      │
│  id (PK)   │      │ provider             │
└──────┬─────┘      └──────────────────────┘
       │
       ├──*─► Account (Google OAuth)
       ├──*─► Session
       ├──1─► UserPreference
       │
       │ 1──1
       └────► Watchlist  ◄──┐
                            │
                            │ 1──*
                            ▼
                  ┌────────────────────┐
                  │ WatchlistChannel   │
                  │ - channelId        │
                  │ - tags[]           │
                  │ - memo             │
                  │ - addedAt          │
                  │ - lastAnalyzedAt   │
                  └────────┬───────────┘
                           │
                           │ refers
                           ▼
                  ┌────────────────────┐
                  │ AnalysisCache      │
                  │ - channelId (PK)   │
                  │ - period           │
                  │ - channelMeta JSON │
                  │ - videos     JSON  │
                  │ - cachedAt         │
                  │ - expiresAt        │
                  └────────────────────┘

User ─*─► SearchHistory  (search/compare/keyword/discover の全種別)
User ─*─► KeywordResearch (キーワード分析結果の保存)
User ─*─► AuditLog
```

### 3.2 Prisma スキーマ（抜粋）

```prisma
generator client { provider = "prisma-client-js" }
datasource db    { provider = "postgresql"; url = env("DATABASE_URL") }

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  emailVerified   DateTime?
  hashedPassword  String?
  name            String?
  image           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  accounts          Account[]
  sessions          Session[]
  apiKeys           EncryptedApiKey[]
  preference        UserPreference?
  watchlist         Watchlist?
  searchHistories   SearchHistory[]
  keywordResearches KeywordResearch[]
  auditLogs         AuditLog[]
}

model Account { /* NextAuth 標準 */ }
model Session { /* NextAuth 標準 */ }
model VerificationToken { /* NextAuth 標準 */ }

enum ApiProvider { YOUTUBE OPENAI ANTHROPIC GOOGLE_AI }

model EncryptedApiKey {
  id             String      @id @default(cuid())
  userId         String
  provider       ApiProvider
  ciphertext     String
  iv             String
  authTag        String
  lastVerifiedAt DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, provider])
}

model UserPreference {
  id              String   @id @default(cuid())
  userId          String   @unique
  theme           String   @default("dark")
  pageSize        Int      @default(50)
  visibleColumns  Json
  hitThreshold    Float    @default(100.0)  // 勝ち動画の伸び率閾値（カスタマイズ可）
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ★ Watchlist：ユーザー単位の中心エンティティ
model Watchlist {
  id        String              @id @default(cuid())
  userId    String              @unique
  createdAt DateTime            @default(now())
  user      User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  channels  WatchlistChannel[]
}

model WatchlistChannel {
  id              String    @id @default(cuid())
  watchlistId     String
  channelId       String    // YouTube UC...
  channelTitle    String    // 表示用キャッシュ
  channelHandle   String?   // 表示用キャッシュ
  thumbnailUrl    String?
  tags            String[]  // ユーザー定義タグ
  memo            String?   @db.Text  // Markdown
  addedAt         DateTime  @default(now())
  lastAnalyzedAt  DateTime?
  watchlist       Watchlist @relation(fields: [watchlistId], references: [id], onDelete: Cascade)
  @@unique([watchlistId, channelId])   // 重複防止
  @@index([watchlistId])
}

// ★ AnalysisCache：横断データ層
model AnalysisCache {
  id           String   @id @default(cuid())
  channelId    String   // YouTube UC...
  period       String   // "1m" | "3m" | "6m" | "1y" | "all"
  channelMeta  Json     // channels.list レスポンス
  videos       Json     // videos.list 配列
  cachedAt     DateTime @default(now())
  expiresAt    DateTime // cachedAt + 1h
  @@unique([channelId, period])
  @@index([expiresAt])  // 期限切れの一掃用
}

enum SearchType { SEARCH COMPARE KEYWORD DISCOVER }

model SearchHistory {
  id         String     @id @default(cuid())
  userId     String
  type       SearchType
  channels   Json?      // SEARCH/COMPARE/DISCOVER 用
  keyword    String?    // KEYWORD 用
  period     String?
  filters    Json?
  resultMeta Json?      // 結果サマリ（再実行不要な軽量情報）
  createdAt  DateTime   @default(now())
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, createdAt(sort: Desc)])
}

// キーワード分析結果の永続化（過去比較用）
model KeywordResearch {
  id          String   @id @default(cuid())
  userId      String
  keyword     String
  totalViews  BigInt
  avgViews    BigInt
  channelCount Int
  topChannels Json     // [{channelId, title, videoCount}]
  histogram   Json     // 伸び率分布
  rawData     Json     // 詳細データ
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, createdAt(sort: Desc)])
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  event     String   // "login.success", "watchlist.add", "keyword.search", ...
  ip        String?
  userAgent String?
  metadata  Json?
  createdAt DateTime @default(now())
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  @@index([userId, createdAt(sort: Desc)])
  @@index([event, createdAt(sort: Desc)])
}
```

### 3.3 暗号化方式（全 API キー共通）

| 項目 | 内容 |
|---|---|
| アルゴリズム | AES-256-GCM |
| 鍵 | `ENCRYPTION_KEY`（32 バイト、Base64、Vercel env） |
| IV | 12 バイト、ランダム生成 |
| Auth Tag | 16 バイト |
| プロバイダごとに別レコード | `(userId, provider)` ユニーク |

---

## 4. 外部 API 設計

### 4.1 YouTube Data API v3

| エンドポイント | 用途 | Quota コスト |
|---|---|---|
| `channels.list` | チャンネル基本情報 + uploads playlist | 1 |
| `playlistItems.list` | アップロード動画 ID 一覧 | 1 / ページ |
| `videos.list` | 動画詳細 | 1 / 50 件 |
| **`search.list`** | **キーワード検索・関連動画取得** | **100 / 回** |

### 4.2 Quota 消費見積もり（拡張版）

| シナリオ | 消費単位 |
|---|---|
| チャンネル 1 (動画 50 本以下) | 3 |
| チャンネル 1 (動画 500 本) | 21 |
| チャンネル 1 (動画 5,000 本) | 201 |
| **Watchlist 30 ch 一括更新（平均規模）** | **600〜2,000** |
| **キーワード分析 1 回** | **100 + (動画詳細取得) 1 = 101** |
| **競合発見 1 回** | **200〜500（複数キーワード search）** |
| 1 日 10,000 Quota 上限 | 中規模 ≒ 450 検索 / キーワード分析 100 回 / Watchlist 全件更新 10 回 |

### 4.3 Quota 管理戦略

```
[実装方針]
1. 全 API 呼び出しに Quota コスト推定値を付与
2. Server Action 内で当日累積 Quota を DB（または Redis 代替で Vercel KV）に記録
3. 高コスト操作（search.list 系）の事前に
   - 残量チェック → 不足ならエラー
   - 残量十分でも消費見積もりモーダル表示（誤実行防止）
4. AnalysisCache TTL 1 時間で重複呼び出しを抑制
5. Watchlist 一括更新は順次実行（タイムアウト回避）+ 進捗 stream
```

### 4.4 入力解決ロジック（チャンネル特定）

```ts
function resolveChannelId(input: string): Promise<string> {
  const trimmed = input.trim();
  if (/^UC[\w-]{22}$/.test(trimmed)) return trimmed;
  const ucMatch = trimmed.match(/channel\/(UC[\w-]{22})/);
  if (ucMatch) return ucMatch[1];
  const handleMatch = trimmed.match(/(?:youtube\.com\/)?@([\w.-]+)/);
  if (handleMatch) {
    const res = await ytApi.channels.list({
      part: ['id'], forHandle: '@' + handleMatch[1]
    });
    if (!res.items?.length) throw new ChannelNotFoundError();
    return res.items[0].id;
  }
  throw new InvalidChannelInputError();
}
```

### 4.5 エラーハンドリング

| ステータス / エラー | ユーザー表示 |
|---|---|
| 403 quotaExceeded | 「本日の API 利用枠を使い切りました。JST 17:00 にリセット」 |
| 403 keyInvalid | 「API キーが無効です」+ 4 項目チェックリスト |
| 404 channelNotFound | 「チャンネルが見つかりません」 |
| 5xx | 「YouTube API で一時的なエラー。少し時間をおいて再試行」+ Sentry |

### 4.6 生成 AI API（保存スロットのみ、MVP では呼び出さない）

| プロバイダ | 疎通テスト用エンドポイント | 課金 |
|---|---|---|
| OpenAI | `GET https://api.openai.com/v1/models` | 0 |
| Anthropic | `GET https://api.anthropic.com/v1/models` | 0 |
| Google AI | `GET https://generativelanguage.googleapis.com/v1beta/models?key=...` | 0 |

---

## 5. 認証設計

### 5.1 NextAuth.js 構成

```
Providers:
  - Credentials (Email + Password + bcrypt + emailVerified チェック)
  - Google OAuth (scope: openid email profile)
Adapter: PrismaAdapter
Session strategy: database
Session maxAge: 30 days
```

### 5.2 認証フロー

#### サインアップ → オンボーディング
```
1. POST /signup { email, password, name }
2. パスワード bcrypt ハッシュ化 → User 作成
3. UserPreference + Watchlist（空）デフォルト作成
4. VerificationToken 発行 → Resend でメール送信
5. リンククリック → /verify-email?token=...
6. 自動ログイン → /settings（オンボーディングツアー開始）
   ステップ 1: API キー登録
   ステップ 2: 「最初のチャンネル」を /search で分析 → Watchlist 追加
   ステップ 3: /insights を開いてみる
```

### 5.3 認可（Middleware）

```ts
// middleware.ts
export const config = {
  matcher: [
    '/search/:path*', '/compare/:path*',
    '/watchlist/:path*', '/insights/:path*',
    '/keywords/:path*', '/discover/:path*',
    '/settings/:path*', '/history/:path*'
  ]
};
```

---

## 6. ドメインロジック設計

### 6.1 ファイル配置

```
lib/youtube/
├── client.ts          # YouTube API クライアント
├── resolver.ts        # チャンネル ID 解決
├── fetcher.ts         # ページング付き一括取得
├── quota-tracker.ts   # Quota 消費記録
├── kpi/
│   ├── channel.ts     # チャンネル KPI（8 指標）
│   ├── video.ts       # 動画 KPI（6 + 拡張 3 指標）
│   ├── spread-rate.ts # 伸び率
│   ├── trend.ts       # 月別投稿頻度・再生数
│   ├── engagement.ts  # 高評価率・コメント率・バイラル係数
│   └── duration.ts    # ISO 8601 ↔ 秒・表示文字列
├── filter.ts
└── sort.ts

lib/insights/                       # ★横断分析
├── pattern-extractor.ts            # 勝ち動画パターン抽出
├── heatmap-aggregator.ts           # 投稿時間ヒートマップ集計
├── thumbnail-gallery.ts            # サムネ収集
├── keyword-analyzer.ts             # タイトル頻出語（kuromoji）
├── duration-distribution.ts        # 動画尺 × 伸び率分布
└── types.ts

lib/keywords/                       # キーワード市場分析
├── market-research.ts              # 関連動画取得 + 集計
└── histogram.ts                    # 伸び率分布

lib/discover/                       # 競合発見
├── related-finder.ts               # シードチャンネルから類似抽出
└── relevance-scorer.ts             # 関連度スコアリング

lib/cache/                          # AnalysisCache
├── analysis-cache.ts               # チャンネル単位のキャッシュ
└── ttl-cleaner.ts                  # 期限切れ削除（Vercel Cron で日次）

lib/ai/                             # フェーズ 2
├── openai/
├── anthropic/
└── google/

lib/crypto/aes-gcm.ts
lib/csv/builder.ts
lib/zip/thumbnails.ts
lib/email/resend.ts
```

### 6.2 主要関数シグネチャ

```ts
// ── KPI ──
export function calcSpreadRate(view: number, subs: number): number { ... }
export function calcEngagementMetrics(v: YTVideo): { likeRate: number; commentRate: number; viralScore: number } { ... }

// ── Insights ──
export interface HitPattern {
  bestWeekday: number;        // 0=Sun..6=Sat
  bestHourRange: [number, number];
  bestDurationRange: [number, number]; // 秒
  hitShortsRatio: number;     // 0..1
  hitCount: number;
  totalCount: number;
}
export function extractHitPattern(videos: YTVideo[], hitThreshold: number): HitPattern { ... }

export type HeatmapMode = 'count' | 'avgSpread';
export function buildHeatmap(videos: YTVideo[], mode: HeatmapMode): number[][] /* [7][24] */ { ... }

export interface KeywordFreq { word: string; hitFreq: number; allFreq: number; lift: number; }
export function extractTitleKeywords(videos: YTVideo[], hitThreshold: number, ngram: 1|2|3): KeywordFreq[] { ... }

export interface DurationScatterPoint { durationSec: number; spread: number; isShort: boolean; }
export function buildDurationScatter(videos: YTVideo[]): DurationScatterPoint[] { ... }

// ── キーワード市場分析 ──
export interface KeywordMarketResult {
  keyword: string;
  totalViews: bigint;
  avgViews: bigint;
  channelCount: number;
  topChannels: Array<{ channelId: string; title: string; videoCount: number }>;
  spreadHistogram: { lt30: number; mid: number; ge100: number };
  publishTiming: Array<{ week: string; count: number }>;
}
export async function analyzeKeywordMarket(keyword: string, ytClient: YTClient): Promise<KeywordMarketResult> { ... }

// ── 競合発見 ──
export interface DiscoverResult {
  seedChannelId: string;
  topKeywords: string[];
  candidates: Array<{ channelId: string; title: string; subs: number; videos: number; score: number }>;
}
export async function discoverSimilarChannels(seedChannelId: string, ytClient: YTClient): Promise<DiscoverResult> { ... }
```

### 6.3 形態素解析（kuromoji.js）

```ts
import { build as buildTokenizer } from 'kuromoji';
let tokenizer: any = null;

export async function tokenize(text: string): Promise<string[]> {
  if (!tokenizer) {
    tokenizer = await new Promise((resolve, reject) =>
      buildTokenizer({ dicPath: 'node_modules/kuromoji/dict' })
        .build((err, t) => err ? reject(err) : resolve(t))
    );
  }
  return tokenizer.tokenize(text)
    .filter((t: any) => ['名詞', '動詞'].includes(t.pos))
    .map((t: any) => t.surface_form);
}
```

※ 辞書ファイル (~10MB) は Vercel デプロイサイズに注意。`output: 'standalone'` と組み合わせて bundle 制御。

### 6.4 単体テスト方針
- KPI 計算: Happy / 0除算 / 境界値 (60s, 180s, 100%, 30%)
- Insights 集計: 既知データセットでの集計結果検証
- Quota tracker: 累積消費の整合性
- Keyword analyzer: 日本語形態素解析の語彙抽出

---

## 7. API 設計（Server Actions / Route Handlers）

### 7.1 Server Actions

| Action | 入力 | 出力 | 認証 |
|---|---|---|---|
| `signUp` | `{ email, password, name }` | `{ ok, message }` | 不要 |
| `signIn` | NextAuth 経由 | - | 不要 |
| `requestPasswordReset` | `{ email }` | `{ ok }` | 不要 |
| `resetPassword` | `{ token, newPassword }` | `{ ok }` | 不要 |
| `saveApiKey` | `{ provider, apiKey }` | `{ ok, verified, message }` | 必要 |
| `deleteApiKey` | `{ provider }` | `{ ok }` | 必要 |
| `testApiKey` | `{ provider }` | `{ ok, message }` | 必要 |
| `updatePreference` | `{ theme?, pageSize?, visibleColumns?, hitThreshold? }` | `{ ok }` | 必要 |
| `analyzeChannel` | `{ input, period, filters }` | `{ channel, videos, kpis, trend }` | 必要 |
| `analyzeCompare` | `{ inputs[], period, filters }` | `{ results[] }` | 必要 |
| **`addToWatchlist`** | `{ channelId, tags?, memo? }` | `{ ok, watchlistCount }` | 必要 |
| **`removeFromWatchlist`** | `{ watchlistChannelId }` | `{ ok }` | 必要 |
| **`updateWatchlistMeta`** | `{ watchlistChannelId, tags?, memo? }` | `{ ok }` | 必要 |
| **`refreshWatchlistAll`** | `{ period }` | stream `{ progress, channelId, ok }` | 必要 |
| **`computeInsights`** | `{ watchlistChannelIds[], period }` | `{ pattern, heatmap, gallery, keywords, scatter }` | 必要 |
| **`analyzeKeyword`** | `{ keyword, confirmed: true }` | `KeywordMarketResult` | 必要 |
| **`discoverChannels`** | `{ seedChannelId, confirmed: true }` | `DiscoverResult` | 必要 |
| `deleteHistory` | `{ id? }` | `{ ok }` | 必要 |
| `deleteAccount` | - | `{ ok }` | 必要 |

### 7.2 Route Handlers

| Route | Method | 用途 |
|---|---|---|
| `/api/auth/[...nextauth]` | * | NextAuth.js 標準 |
| `/api/export/csv` | GET | CSV ストリーミング配信 |
| `/api/export/zip` | GET | サムネ ZIP ストリーミング配信 |
| `/api/cron/cache-cleanup` | GET | Vercel Cron で期限切れ AnalysisCache 削除（日次） |

---

## 8. ディレクトリ構造（詳細）

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── verify-email/page.tsx
│   └── reset-password/[...]
├── (app)/
│   ├── layout.tsx                  # 認証ガード + サイドバー + Quota バナー
│   ├── search/page.tsx
│   ├── compare/page.tsx
│   ├── watchlist/
│   │   ├── page.tsx
│   │   └── _components/
│   │       ├── ChannelCard.tsx
│   │       ├── AddChannelDialog.tsx
│   │       ├── BulkRefreshButton.tsx
│   │       └── TagEditor.tsx
│   ├── insights/
│   │   ├── page.tsx
│   │   └── _components/
│   │       ├── HitPatternPanel.tsx
│   │       ├── PostingHeatmap.tsx
│   │       ├── ThumbnailGallery.tsx
│   │       ├── KeywordFreqTable.tsx
│   │       └── DurationScatter.tsx
│   ├── keywords/
│   │   ├── page.tsx
│   │   └── _components/
│   │       ├── KeywordInput.tsx
│   │       ├── QuotaConfirmModal.tsx
│   │       └── MarketResultPanel.tsx
│   ├── discover/
│   │   ├── page.tsx
│   │   └── _components/
│   │       └── CandidateList.tsx
│   ├── settings/
│   │   ├── page.tsx
│   │   └── _components/
│   │       ├── YouTubeKeyCard.tsx
│   │       ├── AiKeyCard.tsx
│   │       ├── AccountSection.tsx
│   │       └── PreferenceSection.tsx
│   └── history/page.tsx
├── _actions/
│   ├── auth.ts
│   ├── apikey.ts
│   ├── preference.ts
│   ├── analyze.ts
│   ├── watchlist.ts              # ★新規
│   ├── insights.ts               # ★新規
│   ├── keywords.ts               # ★新規
│   ├── discover.ts               # ★新規
│   └── history.ts
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── export/
│   │   ├── csv/route.ts
│   │   └── zip/route.ts
│   └── cron/cache-cleanup/route.ts
└── layout.tsx

components/
├── ui/                           # shadcn/ui
├── layout/
│   ├── Sidebar.tsx
│   ├── MobileNav.tsx
│   ├── KeyMissingModal.tsx
│   └── QuotaBanner.tsx           # ★全画面で Quota 残量表示
├── watchlist/
│   └── AddToWatchlistButton.tsx  # ★全画面の動画/チャンネル一覧に常設
├── channel/, kpi/, charts/

lib/
├── youtube/                      # 第 6 章参照
├── insights/                     # 第 6 章参照
├── keywords/, discover/, cache/  # 第 6 章参照
├── ai/                           # フェーズ 2 用、MVP 中は空
├── crypto/aes-gcm.ts
├── csv/builder.ts
├── zip/thumbnails.ts
└── email/resend.ts

prisma/
├── schema.prisma
└── migrations/

tests/
├── lib/youtube/                  # KPI 計算
├── lib/insights/                 # 集計ロジック
├── lib/keywords/                 # 市場分析
└── e2e/                          # Playwright 6 シナリオ

public/
```

---

## 9. セキュリティ設計

### 9.1 脅威モデル

| 脅威 | 対策 |
|---|---|
| パスワード総当たり | bcrypt + Rate Limit (10 req/min/IP) |
| API キー漏洩（DB 流出） | AES-256-GCM 暗号化、`ENCRYPTION_KEY` は Vercel env のみ |
| API キー漏洩（クライアント） | 平文を一切返さない |
| CSRF | Server Actions の自動 CSRF Token、`SameSite=Lax` Cookie |
| XSS | React 自動エスケープ + CSP ヘッダ |
| Quota 浪費攻撃（悪意のユーザー） | Rate Limit、search.list 系は事前確認モーダル、Watchlist 上限 30 |
| 生成 AI キーの誤課金 | MVP では呼び出さない（保存のみ） |

### 9.2 暗号化キー管理
- 32 バイトを `openssl rand -base64 32` で生成
- Vercel Environment Variables に Production / Preview / Development で別キー

### 9.3 監査ログ対象イベント
- `login.success` / `login.failure`
- `signup.success`
- `apikey.create.<provider>` / `apikey.update.<provider>` / `apikey.delete.<provider>`
- `watchlist.add` / `watchlist.remove` / `watchlist.refresh_all`
- `keyword.search` / `discover.run`
- `account.delete`

---

## 10. パフォーマンス設計

### 10.1 キャッシュ戦略

| 対象 | TTL | 媒体 |
|---|---|---|
| AnalysisCache（チャンネル+動画） | 1 時間 | DB（Neon） |
| Next.js Data Cache | デフォルト | Vercel Edge |
| サムネイル画像 | CDN 標準 | Vercel Edge |
| ユーザー設定 | セッション中 | React Context + Server 初期値 |
| Watchlist データ | 1 時間（AnalysisCache 経由） | DB |
| 形態素解析辞書 | 起動時ロード | Node ランタイム内メモリ |

### 10.2 Watchlist 一括更新の戦略

```
ユーザーが「全件更新」クリック
  ↓
Server Action で Watchlist 取得（最大 30 ch）
  ↓
チャンネル単位で順次処理（並列度 3）
  - 各チャンネル: channels.list + playlistItems.list + videos.list
  - 進捗を Server-Sent Events または Stream で UI に通知
  ↓
完了したチャンネルから順に AnalysisCache に保存
  ↓
WatchlistChannel.lastAnalyzedAt 更新
```

### 10.3 ストリーミング配信
- CSV / ZIP 大量データは Route Handler で `ReadableStream`
- Vercel Node Runtime（`crypto` 利用のため）

### 10.4 Insights の集計タイミング
- Insights ページアクセス時に純関数集計（DB クエリ + メモリ計算）
- AnalysisCache が新鮮 (< 1h) ならそのまま、古ければ「データが古い可能性」バナー
- 重い計算は React Suspense で段階表示

---

## 11. テスト設計

### 11.1 単体テスト（Vitest）
- `lib/youtube/kpi/` 全関数（境界値）
- `lib/insights/` 集計関数（固定データセット）
- `lib/youtube/quota-tracker.ts`
- `lib/crypto/aes-gcm.ts`
- 形態素解析の語彙抽出（日本語サンプル）

### 11.2 統合テスト
- Server Actions（モック Prisma + モック YouTube API）
- AnalysisCache の TTL 動作

### 11.3 E2E テスト（Playwright）

| シナリオ | 内容 |
|---|---|
| E2E-01 | サインアップ → メール認証 → ログイン → `/settings` 誘導 |
| E2E-02 | YouTube API キー登録 → 疎通テスト成功 |
| E2E-03 | `/search` で URL のみ入力 → KPI + 推移グラフ表示 |
| E2E-04 | 検索結果から「★ Watchlist 追加」→ `/watchlist` で確認 |
| E2E-05 | `/insights` で勝ちパターン・ヒートマップ・サムネが表示される |
| E2E-06 | `/keywords` で Quota 確認モーダル → 検索成功 |
| E2E-07 | `/discover` で類似チャンネル発見 → 1 クリック Watchlist 追加 |
| E2E-08 | CSV / ZIP ダウンロードして列・ファイル数検証 |

---

## 12. 監視・運用設計

### 12.1 監視
- **エラー監視**: Sentry（無料枠）
- **アクセス解析**: Vercel Analytics（無料枠）
- **稼働監視**: UptimeRobot（無料、5 分間隔）
- **Quota 消費メトリクス**: 自前ダッシュボード（管理者用、フェーズ 2）

### 12.2 ログ
- Server Actions / Route Handlers は `console.log` （Vercel ログに集約）
- 重要操作は AuditLog テーブルへ

### 12.3 デプロイ
- `main` ブランチ push で本番自動デプロイ
- PR ごとに Preview Deployment
- DB マイグレーションは手動 (`prisma migrate deploy`)
- Vercel Cron で `/api/cron/cache-cleanup` を日次実行（無料枠 2 ジョブ/日）

---

## 13. 残課題・将来検討

| # | 項目 | 検討時期 |
|---|---|---|
| 1 | 生成 AI 機能の本実装（タイトル提案、ニッチレコメンド、サムネ評価、ギャップ抽出） | フェーズ 2 |
| 2 | 新着動画通知（Watchlist 日次差分メール） | フェーズ 2 |
| 3 | チャンネル成長軌跡（長期推移推定） | フェーズ 2 |
| 4 | YouTube API キーをサービス側プロビジョニング | MVP 後 |
| 5 | チーム機能（複数ユーザーで Watchlist 共有） | MVP 後 |
| 6 | コメント分析、感情分析 | フェーズ 2 |
| 7 | 多言語対応（英語） | 海外展開検討時 |
| 8 | 独自ドメイン取得 | ベータリリース後 |
| 9 | アカウントロック・2FA | ユーザー数増加後 |
| 10 | Watchlist 件数上限の拡張プラン | 課金導入時 |
