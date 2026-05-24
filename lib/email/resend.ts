import { Resend } from "resend";

let cachedClient: Resend | null = null;

function getClient(): Resend {
  if (!cachedClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set in environment variables");
    }
    cachedClient = new Resend(apiKey);
  }
  return cachedClient;
}

// 開発初期は Resend デフォルトの送信元を使う (独自ドメインは Phase 10)
const FROM = "Youtube Analyzer <onboarding@resend.dev>";

function getBaseUrl(): string {
  const url = process.env.NEXTAUTH_URL;
  if (!url) {
    throw new Error("NEXTAUTH_URL is not set in environment variables");
  }
  return url.replace(/\/$/, "");
}

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const url = `${getBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  await getClient().emails.send({
    from: FROM,
    to,
    subject: "[Youtube Analyzer] メールアドレスの確認",
    html: `
      <h1 style="font-family: sans-serif; color: #18181b;">メールアドレスを確認してください</h1>
      <p style="font-family: sans-serif; color: #3f3f46;">
        Youtube Analyzer へのご登録ありがとうございます。<br>
        以下のリンクをクリックして登録を完了してください:
      </p>
      <p style="font-family: sans-serif;">
        <a href="${url}" style="background:#a3e635;color:#09090b;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
          メールアドレスを確認する
        </a>
      </p>
      <p style="font-family: sans-serif; color: #71717a; font-size: 0.9em;">
        ボタンが動作しない場合は、以下の URL をコピーしてブラウザで開いてください:<br>
        <a href="${url}" style="color: #71717a;">${url}</a>
      </p>
      <p style="font-family: sans-serif; color: #71717a; font-size: 0.85em;">
        このリンクは 24 時間で期限切れになります。心当たりがない場合は無視してください。
      </p>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  const url = `${getBaseUrl()}/reset-password/${encodeURIComponent(token)}`;
  await getClient().emails.send({
    from: FROM,
    to,
    subject: "[Youtube Analyzer] パスワードリセット",
    html: `
      <h1 style="font-family: sans-serif; color: #18181b;">パスワードのリセット</h1>
      <p style="font-family: sans-serif; color: #3f3f46;">
        以下のリンクから新しいパスワードを設定してください:
      </p>
      <p style="font-family: sans-serif;">
        <a href="${url}" style="background:#a3e635;color:#09090b;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
          パスワードを再設定する
        </a>
      </p>
      <p style="font-family: sans-serif; color: #71717a; font-size: 0.9em;">
        ボタンが動作しない場合は、以下の URL をコピーしてブラウザで開いてください:<br>
        <a href="${url}" style="color: #71717a;">${url}</a>
      </p>
      <p style="font-family: sans-serif; color: #71717a; font-size: 0.85em;">
        このリンクは 1 時間で期限切れになります。<br>
        リクエストに心当たりがない場合は無視してください。パスワードは変更されません。
      </p>
    `,
  });
}
