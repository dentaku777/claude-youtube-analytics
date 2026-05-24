// WBS Excel Generator for Youtube Analyzer project
// Usage: node generate-wbs.mjs
import ExcelJS from 'exceljs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.resolve(__dirname, '..', '..', 'docs', 'WBS.xlsx');

// ────────────────────────────────────────────────────────────────────────
// Task data
// ────────────────────────────────────────────────────────────────────────
const tasks = [
  // Phase 0: 事前準備 (ユーザー作業)
  { phase: 0, phaseName: '事前準備', id: '0.1', name: 'GitHub CLI ログイン', desc: '`! gh auth login` でブラウザ認証', dep: '-', sessions: 0.1, owner: 'ユーザー', deliverable: 'gh 認証完了', req: '-' },
  { phase: 0, phaseName: '事前準備', id: '0.2', name: 'Vercel CLI ログイン', desc: '`! vercel login` でブラウザ認証', dep: '-', sessions: 0.1, owner: 'ユーザー', deliverable: 'vercel 認証完了', req: '-' },
  { phase: 0, phaseName: '事前準備', id: '0.3', name: 'Neon アカウント・DB 作成', desc: 'neon.tech でプロジェクト作成、DATABASE_URL 取得', dep: '-', sessions: 0.2, owner: 'ユーザー', deliverable: 'DATABASE_URL', req: '-' },
  { phase: 0, phaseName: '事前準備', id: '0.4', name: 'Resend API キー取得', desc: 'resend.com アカウント作成、RESEND_API_KEY 取得', dep: '-', sessions: 0.2, owner: 'ユーザー', deliverable: 'RESEND_API_KEY', req: '-' },
  { phase: 0, phaseName: '事前準備', id: '0.5', name: 'Google OAuth Client 作成', desc: 'Google Cloud Console で OAuth 2.0 Client ID/Secret 発行', dep: '-', sessions: 0.3, owner: 'ユーザー', deliverable: 'GOOGLE_CLIENT_ID / SECRET', req: 'F-AUTH-02' },
  { phase: 0, phaseName: '事前準備', id: '0.6', name: 'YouTube Data API キー取得(テスト用)', desc: 'YouTube Data API v3 有効化 + 開発者テスト用 API キー発行', dep: '-', sessions: 0.2, owner: 'ユーザー', deliverable: 'YouTube API キー', req: 'F-KEY-01' },
  { phase: 0, phaseName: '事前準備', id: '0.7', name: 'GitHub リポジトリ作成', desc: '`gh repo create claude-youtube-analytics --private` 等', dep: '0.1', sessions: 0.1, owner: 'ユーザー', deliverable: 'GitHub リポジトリ', req: '-' },

  // Phase 1: 基盤構築
  { phase: 1, phaseName: '基盤構築', id: '1.1', name: 'Next.js 15 プロジェクト初期化', desc: 'create-next-app で App Router + TypeScript + Tailwind 構成', dep: '0.7', sessions: 0.3, owner: 'Claude Code', deliverable: 'app/ ディレクトリ雛形', req: '-' },
  { phase: 1, phaseName: '基盤構築', id: '1.2', name: 'shadcn/ui セットアップ', desc: 'shadcn CLI で UI コンポーネント基盤を導入', dep: '1.1', sessions: 0.2, owner: 'Claude Code', deliverable: 'components/ui/', req: 'F-UI' },
  { phase: 1, phaseName: '基盤構築', id: '1.3', name: 'デザインシステム設定', desc: 'カラーパレット(zinc+lime/cyan)、ダークテーマ、フォント(Inter/JetBrains Mono)', dep: '1.2', sessions: 0.3, owner: 'Claude Code', deliverable: 'tailwind.config.ts, globals.css', req: 'F-UI-02, デザイン要件 §7' },
  { phase: 1, phaseName: '基盤構築', id: '1.4', name: 'サイドバー/MobileNav レイアウト', desc: 'PC 用左サイドバー、モバイル用ボトムナビ、Quota バナー枠', dep: '1.3', sessions: 0.3, owner: 'Claude Code', deliverable: 'components/layout/', req: 'F-UI-05,09' },
  { phase: 1, phaseName: '基盤構築', id: '1.5', name: 'Prisma + Neon 接続', desc: 'Prisma init、DATABASE_URL 設定、User/Account/Session 初期マイグレーション', dep: '0.3,1.1', sessions: 0.2, owner: 'Claude Code', deliverable: 'prisma/schema.prisma, migrations/', req: '-' },
  { phase: 1, phaseName: '基盤構築', id: '1.6', name: 'NextAuth.js v5 設定', desc: 'Credentials + Google OAuth、PrismaAdapter、Session 設定', dep: '0.5,1.5', sessions: 0.4, owner: 'Claude Code', deliverable: 'lib/auth.ts', req: 'F-AUTH-01〜04,08' },
  { phase: 1, phaseName: '基盤構築', id: '1.7', name: 'サインアップ・ログイン UI', desc: 'メール/Google ボタン、パスワードリセット要求画面', dep: '1.6', sessions: 0.3, owner: 'Claude Code', deliverable: 'app/(auth)/', req: 'F-AUTH-01〜05' },
  { phase: 1, phaseName: '基盤構築', id: '1.8', name: 'メール認証フロー', desc: 'Resend 連携、VerificationToken、/verify-email、パスワードリセットメール', dep: '0.4,1.7', sessions: 0.2, owner: 'Claude Code', deliverable: 'lib/email/resend.ts', req: 'F-AUTH-06' },
  { phase: 1, phaseName: '基盤構築', id: '1.9', name: '認証ガード Middleware', desc: '保護パス定義、未ログインリダイレクト', dep: '1.6', sessions: 0.1, owner: 'Claude Code', deliverable: 'middleware.ts', req: 'F-AUTH-08' },

  // Phase 2: APIキー管理
  { phase: 2, phaseName: 'APIキー管理', id: '2.1', name: 'AES-256-GCM 暗号化ユーティリティ', desc: 'lib/crypto/aes-gcm.ts、ENCRYPTION_KEY 利用', dep: '1.5', sessions: 0.2, owner: 'Claude Code', deliverable: 'lib/crypto/aes-gcm.ts + テスト', req: 'F-KEY-05, セキュリティ要件' },
  { phase: 2, phaseName: 'APIキー管理', id: '2.2', name: 'EncryptedApiKey モデル', desc: 'Prisma スキーマ追加 + マイグレーション、ApiProvider enum (YOUTUBE/OPENAI/ANTHROPIC/GOOGLE_AI)', dep: '2.1', sessions: 0.1, owner: 'Claude Code', deliverable: 'マイグレーション', req: 'F-KEY-05' },
  { phase: 2, phaseName: 'APIキー管理', id: '2.3', name: 'YouTube API キー UI + 疎通テスト', desc: '/settings の YouTube セクション、channels.list で疎通検証、4 項目エラーチェック', dep: '2.2', sessions: 0.3, owner: 'Claude Code', deliverable: 'app/(app)/settings/_components/YouTubeKeyCard.tsx', req: 'F-KEY-01〜08' },
  { phase: 2, phaseName: 'APIキー管理', id: '2.4', name: 'AI キー UI (3 ベンダー共通)', desc: '/settings の AI セクション、OpenAI/Anthropic/Google AI、課金ゼロ疎通テスト', dep: '2.2', sessions: 0.3, owner: 'Claude Code', deliverable: 'AiKeyCard.tsx', req: 'F-KEY-10〜15' },
  { phase: 2, phaseName: 'APIキー管理', id: '2.5', name: 'YouTube API クライアント + Quota Tracker', desc: 'lib/youtube/client.ts、quota-tracker.ts、エラー型整備', dep: '2.3', sessions: 0.3, owner: 'Claude Code', deliverable: 'lib/youtube/client.ts, quota-tracker.ts', req: 'F-KEY-07' },

  // Phase 3: /search
  { phase: 3, phaseName: '/search 単一チャンネル分析', id: '3.1', name: 'チャンネル ID 解決ロジック', desc: 'lib/youtube/resolver.ts、@handle/URL/ID 対応', dep: '2.5', sessions: 0.2, owner: 'Claude Code', deliverable: 'lib/youtube/resolver.ts + テスト', req: 'F-SEARCH-01,03' },
  { phase: 3, phaseName: '/search 単一チャンネル分析', id: '3.2', name: '動画一覧フェッチャー', desc: 'lib/youtube/fetcher.ts、playlistItems + videos のページング + 期間打ち切り', dep: '3.1', sessions: 0.3, owner: 'Claude Code', deliverable: 'lib/youtube/fetcher.ts', req: 'F-SEARCH-04,05' },
  { phase: 3, phaseName: '/search 単一チャンネル分析', id: '3.3', name: 'KPI 計算ロジック', desc: 'チャンネル 8 + 動画 6 + 拡張 3 指標、Shorts 判定、伸び率、エンゲージメント', dep: '3.2', sessions: 0.3, owner: 'Claude Code', deliverable: 'lib/youtube/kpi/* + テスト', req: 'F-SEARCH-09〜11, F-KPI-ENGAGE' },
  { phase: 3, phaseName: '/search 単一チャンネル分析', id: '3.4', name: '期間/タイプ/ソートフィルタ', desc: 'フィルタ・ソートの UI と純関数', dep: '3.3', sessions: 0.2, owner: 'Claude Code', deliverable: 'lib/youtube/filter.ts, sort.ts', req: 'F-SEARCH-06〜08' },
  { phase: 3, phaseName: '/search 単一チャンネル分析', id: '3.5', name: '推移グラフ (Recharts)', desc: '月別投稿頻度棒 + 月別再生数折れ線', dep: '3.3', sessions: 0.3, owner: 'Claude Code', deliverable: 'components/charts/TrendBarLine.tsx', req: 'F-SEARCH-13' },
  { phase: 3, phaseName: '/search 単一チャンネル分析', id: '3.6', name: '動画一覧 UI (伸び率色分け)', desc: 'テーブル + サムネ + 100%/30% 色分けハイライト', dep: '3.4', sessions: 0.3, owner: 'Claude Code', deliverable: 'components/channel/VideoTable.tsx', req: 'F-SEARCH-10,11,12' },
  { phase: 3, phaseName: '/search 単一チャンネル分析', id: '3.7', name: '表示列カスタマイズ + 永続化', desc: 'UserPreference 連携、列の表示/非表示・件数設定', dep: '3.6', sessions: 0.3, owner: 'Claude Code', deliverable: 'PreferenceSection 連携', req: 'F-SEARCH-14,15' },
  { phase: 3, phaseName: '/search 単一チャンネル分析', id: '3.8', name: 'キー未設定モーダル', desc: '検索時にキー欠落で /settings 誘導', dep: '3.6', sessions: 0.1, owner: 'Claude Code', deliverable: 'KeyMissingModal.tsx', req: 'F-UI-06' },

  // Phase 4: /compare + エクスポート
  { phase: 4, phaseName: '/compare + エクスポート', id: '4.1', name: '比較画面 UI', desc: '/compare ページ、3 チャンネル入力 UI', dep: '3.6', sessions: 0.3, owner: 'Claude Code', deliverable: 'app/(app)/compare/page.tsx', req: 'F-COMPARE-01,03' },
  { phase: 4, phaseName: '/compare + エクスポート', id: '4.2', name: '並列フェッチ + 統合動画一覧', desc: '3 ch 並列、チャンネル別カラー識別', dep: '4.1', sessions: 0.2, owner: 'Claude Code', deliverable: '比較 Server Action', req: 'F-COMPARE-02,04' },
  { phase: 4, phaseName: '/compare + エクスポート', id: '4.3', name: '推移グラフ重ね合わせ', desc: '3 ch の折れ線を 1 グラフに（線色で識別）', dep: '4.2', sessions: 0.2, owner: 'Claude Code', deliverable: 'CompareTrendLines.tsx', req: 'F-COMPARE-06' },
  { phase: 4, phaseName: '/compare + エクスポート', id: '4.4', name: 'CSV エクスポート (単一/比較)', desc: 'lib/csv/builder.ts、UTF-8 BOM、12/13 列', dep: '3.6,4.2', sessions: 0.2, owner: 'Claude Code', deliverable: 'lib/csv/, /api/export/csv', req: 'F-EXPORT-01,02' },
  { phase: 4, phaseName: '/compare + エクスポート', id: '4.5', name: 'サムネ ZIP エクスポート', desc: 'lib/zip/thumbnails.ts、Route Handler ストリーミング', dep: '4.4', sessions: 0.2, owner: 'Claude Code', deliverable: 'lib/zip/, /api/export/zip', req: 'F-EXPORT-03' },
  { phase: 4, phaseName: '/compare + エクスポート', id: '4.6', name: 'Google Sheets コピペ', desc: 'クリップボード TSV コピー機能', dep: '4.4', sessions: 0.1, owner: 'Claude Code', deliverable: 'コピーボタン', req: 'F-EXPORT-05' },

  // Phase 5: Watchlist + AnalysisCache
  { phase: 5, phaseName: 'Watchlist + AnalysisCache', id: '5.1', name: 'Watchlist 系 DB モデル', desc: 'Watchlist / WatchlistChannel / AnalysisCache スキーマ + マイグレーション', dep: '4.2', sessions: 0.2, owner: 'Claude Code', deliverable: 'マイグレーション', req: 'F-WATCH-01,06' },
  { phase: 5, phaseName: 'Watchlist + AnalysisCache', id: '5.2', name: 'AnalysisCache 抽象化レイヤ', desc: 'lib/cache/analysis-cache.ts、TTL 1h、ttl-cleaner', dep: '5.1', sessions: 0.3, owner: 'Claude Code', deliverable: 'lib/cache/', req: 'F-SEARCH-17' },
  { phase: 5, phaseName: 'Watchlist + AnalysisCache', id: '5.3', name: '/watchlist 画面 UI', desc: 'カード/テーブル、ソート、サブセット選択', dep: '5.1', sessions: 0.3, owner: 'Claude Code', deliverable: 'app/(app)/watchlist/', req: 'F-WATCH-02,03' },
  { phase: 5, phaseName: 'Watchlist + AnalysisCache', id: '5.4', name: '★ Watchlist 追加共通コンポ', desc: '全画面の動画/チャンネル一覧に常設するボタン', dep: '5.1', sessions: 0.2, owner: 'Claude Code', deliverable: 'AddToWatchlistButton.tsx', req: 'F-UI-08, F-WATCH-01' },
  { phase: 5, phaseName: 'Watchlist + AnalysisCache', id: '5.5', name: 'タグ・メモ機能', desc: 'WatchlistChannel.tags / memo の編集 UI', dep: '5.3', sessions: 0.2, owner: 'Claude Code', deliverable: 'TagEditor.tsx', req: 'F-WATCH-04,05' },
  { phase: 5, phaseName: 'Watchlist + AnalysisCache', id: '5.6', name: '一括更新 (進捗ストリーム)', desc: '順次処理 + SSE 進捗通知、Quota 警告モーダル', dep: '5.2', sessions: 0.4, owner: 'Claude Code', deliverable: 'BulkRefreshButton.tsx + Server Action', req: 'F-WATCH-07, F-UI-10' },
  { phase: 5, phaseName: 'Watchlist + AnalysisCache', id: '5.7', name: '個別更新', desc: '単一チャンネル分の AnalysisCache 更新', dep: '5.2', sessions: 0.1, owner: 'Claude Code', deliverable: '更新ボタン', req: 'F-WATCH-08' },

  // Phase 6: /insights
  { phase: 6, phaseName: '/insights ダッシュボード', id: '6.1', name: 'サブセット選択 + 期間フィルタ', desc: 'Watchlist 内チャンネル選択、期間切替 UI', dep: '5.4', sessions: 0.2, owner: 'Claude Code', deliverable: 'app/(app)/insights/page.tsx', req: 'F-INSIGHT-01,02' },
  { phase: 6, phaseName: '/insights ダッシュボード', id: '6.2', name: '勝ち動画パターン抽出', desc: 'lib/insights/pattern-extractor.ts、伸び率 ≥ 100% 集計', dep: '6.1', sessions: 0.3, owner: 'Claude Code', deliverable: 'HitPatternPanel.tsx + ロジック', req: 'F-INSIGHT-10' },
  { phase: 6, phaseName: '/insights ダッシュボード', id: '6.3', name: '投稿時間ヒートマップ', desc: 'lib/insights/heatmap-aggregator.ts、SVG ヒートマップ UI (7×24)', dep: '6.1', sessions: 0.5, owner: 'Claude Code', deliverable: 'PostingHeatmap.tsx', req: 'F-INSIGHT-11' },
  { phase: 6, phaseName: '/insights ダッシュボード', id: '6.4', name: 'サムネギャラリー', desc: '伸び率上位 100 件のグリッド表示', dep: '6.2', sessions: 0.3, owner: 'Claude Code', deliverable: 'ThumbnailGallery.tsx', req: 'F-INSIGHT-12' },
  { phase: 6, phaseName: '/insights ダッシュボード', id: '6.5', name: 'kuromoji + タイトル頻出語', desc: '形態素解析セットアップ、N-gram 集計、hits vs all 比較', dep: '6.1', sessions: 0.5, owner: 'Claude Code', deliverable: 'KeywordFreqTable.tsx, lib/insights/keyword-analyzer.ts', req: 'F-INSIGHT-13' },
  { phase: 6, phaseName: '/insights ダッシュボード', id: '6.6', name: '動画尺 × 伸び率散布図', desc: 'Recharts ScatterChart、Shorts/通常 色分け', dep: '6.2', sessions: 0.3, owner: 'Claude Code', deliverable: 'DurationScatter.tsx', req: 'F-INSIGHT-14' },
  { phase: 6, phaseName: '/insights ダッシュボード', id: '6.7', name: 'エンゲージメント拡張 KPI 表示', desc: 'Likes/Views, Comments/Views, バイラル係数の集計表示', dep: '6.1', sessions: 0.2, owner: 'Claude Code', deliverable: 'EngagementPanel.tsx', req: 'F-INSIGHT-15, F-KPI-ENGAGE' },
  { phase: 6, phaseName: '/insights ダッシュボード', id: '6.8', name: '統合 UI + Insights エクスポート', desc: '5 サブパネル統合、PNG/CSV エクスポート', dep: '6.2,6.3,6.4,6.5,6.6,6.7', sessions: 0.4, owner: 'Claude Code', deliverable: 'insights ページ完成', req: 'F-INSIGHT-20, F-EXPORT-06' },

  // Phase 7: /keywords
  { phase: 7, phaseName: '/keywords キーワード市場分析', id: '7.1', name: 'KeywordResearch モデル', desc: 'Prisma 追加 + マイグレーション', dep: '5.1', sessions: 0.1, owner: 'Claude Code', deliverable: 'マイグレーション', req: 'F-KEYWORD-10' },
  { phase: 7, phaseName: '/keywords キーワード市場分析', id: '7.2', name: 'search.list 連携 + 集計', desc: 'lib/keywords/market-research.ts', dep: '2.5,7.1', sessions: 0.3, owner: 'Claude Code', deliverable: 'lib/keywords/', req: 'F-KEYWORD-03〜08' },
  { phase: 7, phaseName: '/keywords キーワード市場分析', id: '7.3', name: 'Quota 確認モーダル共通コンポ', desc: 'search.list 系の事前確認、消費見積もり表示', dep: '2.5', sessions: 0.2, owner: 'Claude Code', deliverable: 'QuotaConfirmModal.tsx', req: 'F-KEYWORD-02, F-UI-10' },
  { phase: 7, phaseName: '/keywords キーワード市場分析', id: '7.4', name: '市場分析 UI', desc: '市場規模・競合・伸び率分布・公開日分布の可視化', dep: '7.2,7.3', sessions: 0.4, owner: 'Claude Code', deliverable: 'MarketResultPanel.tsx', req: 'F-KEYWORD-05〜08' },
  { phase: 7, phaseName: '/keywords キーワード市場分析', id: '7.5', name: '上位ch → Watchlist 追加', desc: '1 クリックで Watchlist 登録', dep: '5.4,7.4', sessions: 0.1, owner: 'Claude Code', deliverable: 'Watchlist 統合ボタン', req: 'F-KEYWORD-09' },

  // Phase 8: /discover
  { phase: 8, phaseName: '/discover 競合チャンネル発見', id: '8.1', name: 'シード→キーワード抽出', desc: 'シードの直近動画タイトルから kuromoji で頻出語抽出', dep: '6.5', sessions: 0.3, owner: 'Claude Code', deliverable: 'lib/discover/', req: 'F-DISCOVER-03' },
  { phase: 8, phaseName: '/discover 競合チャンネル発見', id: '8.2', name: '類似チャンネル探索ロジック', desc: 'lib/discover/related-finder.ts、複数キーワード search', dep: '8.1,7.3', sessions: 0.4, owner: 'Claude Code', deliverable: 'related-finder.ts', req: 'F-DISCOVER-03' },
  { phase: 8, phaseName: '/discover 競合チャンネル発見', id: '8.3', name: '関連度スコアリング', desc: 'キーワード一致 + 規模類似 + 伸び率類似の合成スコア', dep: '8.2', sessions: 0.3, owner: 'Claude Code', deliverable: 'relevance-scorer.ts', req: 'F-DISCOVER-04' },
  { phase: 8, phaseName: '/discover 競合チャンネル発見', id: '8.4', name: '候補一覧 UI', desc: 'カード表示、スコア・規模・サムネ', dep: '8.3', sessions: 0.3, owner: 'Claude Code', deliverable: 'CandidateList.tsx', req: 'F-DISCOVER-05' },
  { phase: 8, phaseName: '/discover 競合チャンネル発見', id: '8.5', name: '1 クリック追加・分析遷移', desc: 'Watchlist 追加 / /search 遷移ボタン', dep: '5.4,8.4', sessions: 0.2, owner: 'Claude Code', deliverable: '統合 UI', req: 'F-DISCOVER-06,07' },

  // Phase 9: 履歴・テスト・磨き込み
  { phase: 9, phaseName: '履歴・テスト・磨き込み', id: '9.1', name: '/history 統合 UI', desc: 'SEARCH/COMPARE/KEYWORD/DISCOVER 4 種別の履歴一覧、再実行', dep: '7.4,8.4', sessions: 0.3, owner: 'Claude Code', deliverable: 'app/(app)/history/', req: 'F-HISTORY-01〜04' },
  { phase: 9, phaseName: '履歴・テスト・磨き込み', id: '9.2', name: 'Quota 残量バナー', desc: '全画面右上常設、しきい値で色変化', dep: '2.5', sessions: 0.2, owner: 'Claude Code', deliverable: 'QuotaBanner.tsx', req: 'F-UI-09' },
  { phase: 9, phaseName: '履歴・テスト・磨き込み', id: '9.3', name: 'オンボーディングツアー', desc: '初回ログイン時の 3 ステップガイド (キー登録→Watchlist→Insights)', dep: '5.4', sessions: 0.3, owner: 'Claude Code', deliverable: 'オンボーディング Tour', req: 'F-UI-07' },
  { phase: 9, phaseName: '履歴・テスト・磨き込み', id: '9.4', name: 'エラーハンドリング UI 仕上げ', desc: 'Quota 超過・キー無効・404 等の文言・誘導整備', dep: '9.2', sessions: 0.3, owner: 'Claude Code', deliverable: '各種エラー UI', req: 'エラー要件 §5' },
  { phase: 9, phaseName: '履歴・テスト・磨き込み', id: '9.5', name: 'レスポンシブ対応仕上げ', desc: 'iPhone 13 サイズで全画面動作確認・調整', dep: '8.5', sessions: 0.3, owner: 'Claude Code + ユーザー', deliverable: 'モバイル動作確認', req: 'F-UI-01' },
  { phase: 9, phaseName: '履歴・テスト・磨き込み', id: '9.6', name: 'Vitest 単体テスト整備', desc: 'KPI・Insights 集計・暗号化・形態素解析の境界値テスト', dep: '6.8', sessions: 0.5, owner: 'Claude Code', deliverable: 'tests/lib/', req: '保守性要件 §6.5' },
  { phase: 9, phaseName: '履歴・テスト・磨き込み', id: '9.7', name: 'Playwright E2E 8 シナリオ', desc: 'サインアップ〜エクスポートまでの主要導線', dep: '9.1', sessions: 0.6, owner: 'Claude Code', deliverable: 'tests/e2e/', req: '保守性要件 §6.5' },
  { phase: 9, phaseName: '履歴・テスト・磨き込み', id: '9.8', name: 'A11y・Lighthouse 改善', desc: 'Perf ≥ 80, A11y ≥ 90, BP ≥ 90', dep: '9.5', sessions: 0.3, owner: 'Claude Code', deliverable: 'Lighthouse レポート', req: '受け入れ基準' },

  // Phase 10: 本番化
  { phase: 10, phaseName: '本番化', id: '10.1', name: 'Vercel デプロイ + 環境変数', desc: 'Vercel CLI で初回デプロイ、本番 ENCRYPTION_KEY 等を Vercel env に設定', dep: '9.7', sessions: 0.2, owner: 'Claude Code + ユーザー', deliverable: '本番 URL 発行', req: '-' },
  { phase: 10, phaseName: '本番化', id: '10.2', name: 'Sentry 接続', desc: 'Next.js Sentry SDK、エラー監視開始', dep: '10.1', sessions: 0.1, owner: 'Claude Code', deliverable: 'sentry.client.config.ts', req: '監視要件 §12' },
  { phase: 10, phaseName: '本番化', id: '10.3', name: 'UptimeRobot 設定', desc: 'モニター追加、5 分間隔', dep: '10.1', sessions: 0.1, owner: 'ユーザー', deliverable: 'モニター', req: '-' },
  { phase: 10, phaseName: '本番化', id: '10.4', name: 'Vercel Cron 設定', desc: 'cache-cleanup の日次ジョブ登録', dep: '10.1', sessions: 0.1, owner: 'Claude Code', deliverable: 'vercel.json', req: '-' },
  { phase: 10, phaseName: '本番化', id: '10.5', name: 'プライバシーポリシー・利用規約', desc: 'API キー取扱を明示したドラフト作成', dep: '10.1', sessions: 0.3, owner: 'Claude Code', deliverable: 'app/legal/', req: '法令遵守要件 §6.7' },
  { phase: 10, phaseName: '本番化', id: '10.6', name: '本番動作確認 + ベータ公開', desc: '主要導線を本番で再検証、URL 公開', dep: '10.2,10.3,10.4,10.5', sessions: 0.2, owner: 'ユーザー + Claude', deliverable: 'ベータ公開', req: '-' },
];

// Cumulative sessions calc
let cum = 0;
tasks.forEach(t => { cum += t.sessions; t.cum = Math.round(cum * 10) / 10; });
const TOTAL = Math.round(cum * 10) / 10;

// Milestones
const milestones = [
  { id: 'M1', name: '認証完了 + デザインシステム確立', condition: 'Phase 1 全タスク完了', timing: '累計 ' + tasks.filter(t => t.phase <= 1).reduce((a, t) => a + t.sessions, 0).toFixed(1) + ' セッション' },
  { id: 'M2', name: '基本分析動作', condition: 'Phase 4 全タスク完了 (CSV/ZIP 出力まで)', timing: '累計 ' + tasks.filter(t => t.phase <= 4).reduce((a, t) => a + t.sessions, 0).toFixed(1) + ' セッション' },
  { id: 'M3', name: '横断分析基盤動作 (Watchlist + Insights)', condition: 'Phase 6 全タスク完了', timing: '累計 ' + tasks.filter(t => t.phase <= 6).reduce((a, t) => a + t.sessions, 0).toFixed(1) + ' セッション' },
  { id: 'M4', name: '全機能 MVP', condition: 'Phase 8 全タスク完了 (Discover まで)', timing: '累計 ' + tasks.filter(t => t.phase <= 8).reduce((a, t) => a + t.sessions, 0).toFixed(1) + ' セッション' },
  { id: 'M5', name: '本番リリース', condition: 'Phase 10 全タスク完了', timing: '累計 ' + TOTAL + ' セッション' },
];

// ────────────────────────────────────────────────────────────────────────
// Build Excel
// ────────────────────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = 'Claude Code';
wb.created = new Date();

// Styles
const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } };
const headerFont = { color: { argb: 'FFFAFAFA' }, bold: true, size: 11 };
const headerAlign = { vertical: 'middle', horizontal: 'center', wrapText: true };
const border = { style: 'thin', color: { argb: 'FFD4D4D8' } };
const cellBorder = { top: border, left: border, bottom: border, right: border };
const phaseColors = [
  'FFFEF3C7', // 0 amber-100 (User tasks)
  'FFE0F2FE', // 1 sky-100
  'FFF0FDF4', // 2 green-50
  'FFFDF4FF', // 3 fuchsia-50
  'FFFFF7ED', // 4 orange-50
  'FFECFEFF', // 5 cyan-50
  'FFFEFCE8', // 6 yellow-50
  'FFFAF5FF', // 7 purple-50
  'FFEFF6FF', // 8 blue-50
  'FFF5F5F4', // 9 stone-100
  'FFFEE2E2', // 10 red-100
];

// ── Sheet 1: サマリ ──
const summary = wb.addWorksheet('サマリ', { views: [{ state: 'frozen', ySplit: 1 }] });
summary.columns = [
  { header: 'Phase', key: 'phase', width: 8 },
  { header: 'フェーズ名', key: 'name', width: 32 },
  { header: 'タスク数', key: 'count', width: 10 },
  { header: 'セッション数', key: 'sessions', width: 14 },
  { header: '累計セッション', key: 'cum', width: 16 },
  { header: '主要成果物', key: 'deliverables', width: 60 },
  { header: 'マイルストーン', key: 'ms', width: 32 },
];
summary.getRow(1).eachCell(c => { c.fill = headerFill; c.font = headerFont; c.alignment = headerAlign; c.border = cellBorder; });
summary.getRow(1).height = 28;

const phaseGroups = new Map();
tasks.forEach(t => {
  if (!phaseGroups.has(t.phase)) phaseGroups.set(t.phase, { phase: t.phase, name: t.phaseName, count: 0, sessions: 0, lastCum: 0, deliverables: [] });
  const g = phaseGroups.get(t.phase);
  g.count++;
  g.sessions += t.sessions;
  g.lastCum = t.cum;
  g.deliverables.push(t.deliverable);
});

const msByPhase = { 1: 'M1: 認証完了', 4: 'M2: 基本分析動作', 6: 'M3: 横断分析基盤', 8: 'M4: 全機能 MVP', 10: 'M5: 本番リリース' };

for (const [phase, g] of phaseGroups) {
  const row = summary.addRow({
    phase: phase,
    name: g.name,
    count: g.count,
    sessions: Math.round(g.sessions * 10) / 10,
    cum: g.lastCum,
    deliverables: g.deliverables.slice(0, 3).join(' / ') + (g.deliverables.length > 3 ? ' …' : ''),
    ms: msByPhase[phase] || '',
  });
  row.eachCell(c => {
    c.border = cellBorder;
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: phaseColors[phase] } };
    c.alignment = { vertical: 'middle', wrapText: true };
  });
  row.getCell('phase').alignment = { vertical: 'middle', horizontal: 'center' };
  row.getCell('count').alignment = { vertical: 'middle', horizontal: 'center' };
  row.getCell('sessions').alignment = { vertical: 'middle', horizontal: 'center' };
  row.getCell('cum').alignment = { vertical: 'middle', horizontal: 'center' };
  if (msByPhase[phase]) row.getCell('ms').font = { bold: true, color: { argb: 'FFC2410C' } };
  row.height = 30;
}

// Total row
const totalRow = summary.addRow({ phase: '', name: '合計', count: tasks.length, sessions: TOTAL, cum: TOTAL, deliverables: '', ms: '' });
totalRow.eachCell(c => {
  c.border = cellBorder;
  c.font = { bold: true };
  c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } };
  c.font = { bold: true, color: { argb: 'FFFAFAFA' } };
  c.alignment = { vertical: 'middle', horizontal: 'center' };
});
totalRow.height = 28;

// Note row above table
summary.insertRow(1, [
  `Youtube Analyzer / WBS サマリ — 全 ${tasks.length} タスク / 約 ${TOTAL} セッション (1 セッション ≒ 集中作業 2〜3 時間)`,
]);
summary.mergeCells(1, 1, 1, 7);
summary.getRow(1).getCell(1).font = { bold: true, size: 13, color: { argb: 'FFFAFAFA' } };
summary.getRow(1).getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF09090B' } };
summary.getRow(1).getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
summary.getRow(1).height = 32;
summary.views = [{ state: 'frozen', ySplit: 2 }];

// ── Sheet 2: WBS詳細 ──
const detail = wb.addWorksheet('WBS詳細', { views: [{ state: 'frozen', ySplit: 1 }] });
detail.columns = [
  { header: 'No.', key: 'no', width: 6 },
  { header: 'Phase', key: 'phase', width: 7 },
  { header: 'フェーズ名', key: 'phaseName', width: 22 },
  { header: 'タスクID', key: 'id', width: 10 },
  { header: 'タスク名', key: 'name', width: 32 },
  { header: '内容', key: 'desc', width: 60 },
  { header: '依存タスク', key: 'dep', width: 12 },
  { header: 'セッション数', key: 'sessions', width: 12 },
  { header: '累計', key: 'cum', width: 8 },
  { header: '担当', key: 'owner', width: 18 },
  { header: '成果物', key: 'deliverable', width: 36 },
  { header: '関連要件ID', key: 'req', width: 28 },
];
detail.getRow(1).eachCell(c => { c.fill = headerFill; c.font = headerFont; c.alignment = headerAlign; c.border = cellBorder; });
detail.getRow(1).height = 32;
detail.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: detail.columns.length } };

tasks.forEach((t, i) => {
  const row = detail.addRow({
    no: i + 1,
    phase: t.phase,
    phaseName: t.phaseName,
    id: t.id,
    name: t.name,
    desc: t.desc,
    dep: t.dep,
    sessions: t.sessions,
    cum: t.cum,
    owner: t.owner,
    deliverable: t.deliverable,
    req: t.req,
  });
  row.eachCell(c => {
    c.border = cellBorder;
    c.alignment = { vertical: 'top', wrapText: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: phaseColors[t.phase] } };
  });
  row.getCell('no').alignment = { vertical: 'top', horizontal: 'center' };
  row.getCell('phase').alignment = { vertical: 'top', horizontal: 'center' };
  row.getCell('id').alignment = { vertical: 'top', horizontal: 'center' };
  row.getCell('sessions').alignment = { vertical: 'top', horizontal: 'center' };
  row.getCell('cum').alignment = { vertical: 'top', horizontal: 'center' };
  row.getCell('dep').alignment = { vertical: 'top', horizontal: 'center' };
  if (t.owner.includes('ユーザー')) {
    row.getCell('owner').font = { bold: true, color: { argb: 'FFC2410C' } };
  }
  row.height = 36;
});

// ── Sheet 3: マイルストーン ──
const msSheet = wb.addWorksheet('マイルストーン');
msSheet.columns = [
  { header: 'ID', key: 'id', width: 8 },
  { header: 'マイルストーン名', key: 'name', width: 40 },
  { header: '達成条件', key: 'condition', width: 40 },
  { header: 'タイミング', key: 'timing', width: 24 },
];
msSheet.getRow(1).eachCell(c => { c.fill = headerFill; c.font = headerFont; c.alignment = headerAlign; c.border = cellBorder; });
msSheet.getRow(1).height = 28;
milestones.forEach(m => {
  const r = msSheet.addRow(m);
  r.eachCell(c => { c.border = cellBorder; c.alignment = { vertical: 'middle', wrapText: true }; });
  r.getCell('id').font = { bold: true };
  r.height = 28;
});

// ── Sheet 4: 凡例 ──
const legend = wb.addWorksheet('凡例');
legend.columns = [
  { header: '項目', key: 'item', width: 24 },
  { header: '内容', key: 'desc', width: 90 },
];
legend.getRow(1).eachCell(c => { c.fill = headerFill; c.font = headerFont; c.alignment = headerAlign; c.border = cellBorder; });
legend.getRow(1).height = 28;
const legends = [
  { item: 'セッション', desc: '1 セッション ≒ ユーザーが集中作業できる 2〜3 時間分の Claude Code ペアプロを指す。実時間は確認待ち・外部設定で律速され変動する。' },
  { item: 'Phase', desc: '開発フェーズ。0 は事前準備(ユーザー作業中心)、1〜10 が Claude Code 主導の実装フェーズ。' },
  { item: '依存タスク', desc: 'そのタスクを開始する前に完了している必要があるタスクID。"-" は依存なし。' },
  { item: '担当', desc: 'ユーザー = ユーザー本人が外部サービス操作。Claude Code = Claude が実装。両方 = 連携が必要。' },
  { item: '色分け (Phase)', desc: 'Phase ごとに行の背景色を変更。Phase 0 (アンバー) はユーザー作業中心、他は実装フェーズ。' },
  { item: 'マイルストーン', desc: 'M1〜M5。区切りごとに UI を触って動作確認 → 次フェーズへ進む判断材料。' },
  { item: '関連要件ID', desc: 'docs/02_requirements.md の機能要件 ID と対応。逆引きで仕様確認に利用。' },
  { item: '合計', desc: `タスク数 ${tasks.length}、セッション数約 ${TOTAL}。Phase 0 (ユーザー作業 約 1.2) を除いた Claude 実装は約 ${(TOTAL - 1.2).toFixed(1)} セッション。` },
];
legends.forEach(l => {
  const r = legend.addRow(l);
  r.eachCell(c => { c.border = cellBorder; c.alignment = { vertical: 'top', wrapText: true }; });
  r.getCell('item').font = { bold: true };
  r.height = 36;
});

// Save
await wb.xlsx.writeFile(OUTPUT);
console.log(`OK: ${OUTPUT}`);
console.log(`Total tasks: ${tasks.length}`);
console.log(`Total sessions: ${TOTAL}`);
