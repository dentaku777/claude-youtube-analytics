# SETUP.md — Phase 0 セットアップガイド

このガイドは、Youtube Analyzer の開発に着手する前に **ユーザーご自身** で完了させていただく外部サービスの準備手順をまとめたものです。

完了したら Claude Code に「Phase 0 完了」と伝えると、Phase 1（基盤構築）に着手します。

---

## 0. このガイドの全体像

### 必要なアカウント・キー一覧

| # | サービス | 用途 | 無料枠 | 所要時間 |
|---|---|---|---|---|
| 0.1 | GitHub CLI ログイン | リポジトリ管理 | 無制限（個人用） | 2 分 |
| 0.2 | Vercel CLI ログイン | 本番ホスティング | Hobby（非商用）| 2 分 |
| 0.3 | Neon (PostgreSQL) | DB | 0.5GB ストレージ、Compute 自動停止 | 5 分 |
| 0.4 | Resend | メール送信（パスワードリセット等）| 100通/日、3,000通/月 | 5 分 |
| 0.5 | Google OAuth Client | Google ログイン機能 | 無料 | 10 分（最難関）|
| 0.6 | YouTube Data API キー | テスト用 | 10,000 ユニット/日 | 5 分 |
| 0.7 | GitHub リポジトリ作成 | コード保管 | 無料 | Claude が代行 |

**合計所要時間: 約 30 分**

### 最終的に集める値（環境変数）

すべてのセットアップが終わると、以下の値が手元に揃います。これらは Phase 1 で `.env.local` に書き込みます。

```
# DB
DATABASE_URL=postgresql://user:pass@xxx.neon.tech/youtube_analyzer

# NextAuth
NEXTAUTH_SECRET=（Phase 1 で Claude が生成）
NEXTAUTH_URL=http://localhost:3000   # 開発時。本番は Phase 10 で更新

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx

# 暗号化キー（API キー暗号化用）
ENCRYPTION_KEY=（Phase 1 で Claude が生成）

# メール送信
RESEND_API_KEY=re_xxxxxxxxxxxx

# YouTube API キー（テスト用、開発時のみ）
TEST_YOUTUBE_API_KEY=AIzaSyxxxxxxxxxx
```

> ⚠️ これらの値はすべて秘密情報です。GitHub にコミットしてはいけません（.gitignore で `.env*` を除外する設定は Claude が行います）。

---

## 0.1 GitHub CLI ログイン

### 目的
リポジトリ作成・PR 操作を CLI でできるようにする。

### 手順
1. Claude Code のプロンプトで以下を入力（`!` を頭につけるとこのセッション内で実行されます）
   ```
   ! gh auth login
   ```
2. 対話プロンプトで以下を選択
   - `What account do you want to log into?` → **GitHub.com**
   - `What is your preferred protocol for Git operations?` → **HTTPS**
   - `Authenticate Git with your GitHub credentials?` → **Yes**
   - `How would you like to authenticate GitHub CLI?` → **Login with a web browser**
3. ターミナルに **ワンタイムコード**（例: `XXXX-XXXX`）が表示されるので、メモする
4. Enter キーを押すとブラウザが開く → コードを入力 → Authorize
5. ブラウザに「Authentication complete」と出たらターミナルに戻る
6. 確認: `! gh auth status` → `✓ Logged in to github.com as <ユーザー名>` と出れば OK

---

## 0.2 Vercel CLI ログイン

### 目的
ローカルから本番デプロイを実行できるようにする。

### 手順
1. プロンプトで実行
   ```
   ! vercel login
   ```
2. 認証方法を選ぶプロンプトが出る → **Continue with GitHub**（推奨。GitHub 連携が便利）
3. ブラウザが開く → GitHub アカウントで認可
4. 確認: `! vercel whoami` → ユーザー名が表示されれば OK

> Vercel アカウントを持っていない場合、初回ログイン時に自動でアカウントが作成されます（メール認証等は不要）。

---

## 0.3 Neon（PostgreSQL）セットアップ

### 目的
無料の PostgreSQL DB を 1 つ準備し、接続文字列を取得する。

### 手順
1. https://neon.tech にアクセス → 右上 **Sign Up**
2. **Continue with GitHub** で連携（推奨）
3. 初回サインアップ時の質問
   - Project name: `youtube-analyzer`
   - Postgres version: **17**（最新）
   - Cloud provider: **AWS**
   - Region: **Asia Pacific (Tokyo)** または **Asia Pacific (Singapore)**
4. 「Create project」をクリック
5. プロジェクト作成後、**Connection Details** が表示される
6. 「Connection string」の **Pooled connection** をコピー（重要：Direct ではなく Pooled）
   - 形式: `postgresql://user:pass@ep-xxx-pooler.ap-northeast-1.aws.neon.tech/neondb?sslmode=require`
7. このまま安全な場所（パスワードマネージャ等）に保管 → **DATABASE_URL として後で使用**

### ハマりポイント
- パスワードは作成時に **1 回しか表示されない** ことがある。コピー漏れに注意（再生成は Dashboard → Roles で可能）
- 無料プランは **Compute 自動停止**（5 分間アクセスなしで停止）。初回アクセスで起動するため数秒のラグあり

---

## 0.4 Resend（メール送信）セットアップ

### 目的
パスワードリセット・メール認証のメール送信用 API キーを取得する。

### 手順
1. https://resend.com にアクセス → **Sign Up**
2. GitHub or Google 連携でサインアップ
3. メール認証を済ませる
4. 左サイドバーの **API Keys** をクリック
5. **Create API Key** ボタン
   - Name: `youtube-analyzer-dev`
   - Permission: **Sending access**
   - Domain: **All domains**（最初は OK）
6. 表示される `re_xxxxxxxxxxxx` をコピー → **RESEND_API_KEY として保管**（再表示不可）

### MVP 段階の送信元アドレス
本格的に独自ドメインを使うには Domain 認証が必要ですが、開発初期は Resend が用意している `onboarding@resend.dev` を送信元として使えます。Claude が初期設定でこれを使うコードを書きます。

> 本番リリース時（Phase 10）には独自ドメインを設定するのが推奨。これは MVP 後で OK です。

---

## 0.5 Google OAuth Client 作成（最難関）

### 目的
ユーザーが「Google でログイン」できるようにするための OAuth 2.0 Client ID / Secret を取得する。

### 手順

#### ステップ 1: Google Cloud プロジェクト作成
1. https://console.cloud.google.com にアクセス（Google アカウントでログイン済前提）
2. 上部のプロジェクト選択ドロップダウン → **新しいプロジェクト**
3. プロジェクト名: `youtube-analyzer` → **作成**
4. 数秒で作成完了。上部のプロジェクト名が `youtube-analyzer` になっていることを確認

#### ステップ 2: OAuth 同意画面の設定
1. 左メニュー（≡）→ **API とサービス** → **OAuth 同意画面**
2. User Type: **外部** → 作成
3. アプリ情報
   - アプリ名: `Youtube Analyzer`
   - ユーザー サポートメール: ご自身のメール
   - アプリのロゴ: 空欄で OK
4. アプリのドメイン: 全部空欄で OK
5. 承認済みドメイン: 空欄で OK
6. デベロッパーの連絡先情報: ご自身のメール
7. **保存して次へ**
8. スコープ: そのまま **保存して次へ**（後で `openid email profile` が自動付与される）
9. テストユーザー: ご自身のメールを **+ ADD USERS** で追加 → 保存して次へ
10. 概要画面で確認 → **ダッシュボードに戻る**

> ⚠️ アプリは「テスト中」ステータスのままで OK です。本番公開には Google の審査が必要ですが、ベータ期間中はテストユーザー追加で運用できます（最大 100 ユーザー）。

#### ステップ 3: OAuth Client ID 作成
1. 左メニュー → **API とサービス** → **認証情報**
2. 上部の **+ 認証情報を作成** → **OAuth クライアント ID**
3. アプリケーションの種類: **ウェブ アプリケーション**
4. 名前: `Youtube Analyzer Web`
5. **承認済みの JavaScript 生成元**
   - `+ URI を追加` → `http://localhost:3000`
6. **承認済みのリダイレクト URI**
   - `+ URI を追加` → `http://localhost:3000/api/auth/callback/google`
   - ※ 本番 URL は Phase 10 で追加（例: `https://youtube-analyzer.vercel.app/api/auth/callback/google`）
7. **作成** をクリック
8. ダイアログで以下を **両方コピー**
   - クライアント ID: `xxx.apps.googleusercontent.com` → **GOOGLE_CLIENT_ID**
   - クライアント シークレット: `GOCSPX-xxxxxxxxxxxx` → **GOOGLE_CLIENT_SECRET**
9. 安全な場所に保管

### ハマりポイント
- リダイレクト URI のパスを間違えると `redirect_uri_mismatch` エラーになる。**`/api/auth/callback/google` の `/` 有無も含めて正確に**
- 「テストユーザー」に自分のメールを追加していないと、Google ログイン時に `アクセスがブロックされました` と出る
- シークレットは作成時のダイアログでしかコピーできないので、メモを忘れた場合は新しいシークレットを作成すること

---

## 0.6 YouTube Data API キー取得（テスト用）

### 目的
**開発中の動作確認用** に YouTube Data API キーを 1 つ取得する。

> ⚠️ これは「ユーザーが本番運用で使うキー」とは別の **開発テスト専用** です。本番ではエンドユーザーが各自のキーを `/settings` に登録します。

### 手順
（0.5 と同じ Google Cloud プロジェクト内で続けて作業します）

1. https://console.cloud.google.com で `youtube-analyzer` プロジェクトを選択
2. 左メニュー → **API とサービス** → **ライブラリ**
3. 検索ボックスに `YouTube Data API v3` と入力
4. **YouTube Data API v3** をクリック → **有効にする**
5. 左メニュー → **API とサービス** → **認証情報**
6. 上部 **+ 認証情報を作成** → **API キー**
7. 表示された `AIzaSy...` をコピー → **TEST_YOUTUBE_API_KEY** として保管
8. （推奨）「キーを制限」をクリック
   - **API の制限** → 「キーを制限」 → **YouTube Data API v3** のみ選択 → 保存
   - これで万一漏洩しても他の API には使えなくなる

### 確認テスト
キーが有効か確認するワンライナー（コピペで実行）:
```
! curl "https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=@youtube&key=YOUR_API_KEY_HERE"
```
JSON でチャンネル情報が返ってくれば OK。`error` が返ったらキーが無効。

---

## 0.7 GitHub リポジトリ作成

### このタスクは Claude が代行します

0.1 で `gh` ログインが終わっていれば、Claude が以下のコマンドを実行します（ユーザー作業不要）。
```
gh repo create claude-youtube-analytics --private --source=. --remote=origin
```
リポジトリ名・public/private はご希望に合わせて変更可能（着手時に確認します）。

---

## 完了チェックリスト

Phase 1 着手前に、以下の値がすべて手元に揃っていることを確認してください。

- [ ] `gh auth status` で GitHub ログイン確認できる
- [ ] `vercel whoami` で Vercel ログイン確認できる
- [ ] **DATABASE_URL** （Neon Pooled connection string）を保管した
- [ ] **RESEND_API_KEY** を保管した
- [ ] **GOOGLE_CLIENT_ID** を保管した
- [ ] **GOOGLE_CLIENT_SECRET** を保管した
- [ ] **TEST_YOUTUBE_API_KEY** を保管した（curl テスト通過）
- [ ] Google OAuth 同意画面で自分のメールをテストユーザーに追加済み

### 値の Claude への渡し方

Phase 1 着手時に、Claude が `.env.local` を作成します。
そのタイミングで上記の値を **チャットに貼り付けて** ください。

> 機密情報をチャットに貼ることに抵抗がある場合は、ユーザーご自身で `.env.local` に書き込んでいただいても OK です（Claude には「.env.local に値を設定した」と伝えるだけ）。

---

## トラブルシューティング

### Neon Compute が止まる
無料プランは 5 分アクセスなしで Compute が停止します。最初のクエリで自動再開（数秒）。これは正常動作です。

### Google OAuth で `アクセスがブロックされました`
OAuth 同意画面 → テストユーザーに使用中の Google アカウントが追加されているか確認。

### Resend のメールが届かない
- 迷惑メールフォルダを確認
- 無料プランは送信先が **登録メールアドレスに限定** されることあり（送信元 `onboarding@resend.dev` 利用時）
- Resend ダッシュボードの **Logs** で送信状況を確認

### YouTube API で 403 keyInvalid
- API キーが正しくコピーされているか（前後の空白に注意）
- YouTube Data API v3 が有効化されているか
- キー制限を厳しくしすぎていないか

### gh auth login のブラウザが開かない
WSL や SSH 経由でターミナルを使っている場合に発生。`! gh auth login --web` で URL を手動で開く方法に切り替えられる。

---

## Phase 0 完了後

「Phase 0 完了」と Claude にお伝えください。
続けて Phase 1（基盤構築）に進みます。Phase 1 では以下を Claude が自動実行します:

- Next.js 15 プロジェクト初期化
- `.env.local` 作成（収集した値を反映）
- `NEXTAUTH_SECRET` 自動生成（`openssl rand -base64 32`）
- `ENCRYPTION_KEY` 自動生成（同上）
- Prisma + Neon 接続テスト
- 認証基盤の構築

Phase 1 中も追加のユーザー操作が発生する場面（リダイレクト URI 追加など）があれば、その都度 Claude から指示します。
