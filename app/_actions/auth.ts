"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/email/resend";

// ──────────────────────────────────────────────────────────
// Sign Up
// ──────────────────────────────────────────────────────────

const signUpSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z
    .string()
    .min(8, "パスワードは 8 文字以上にしてください")
    .max(128, "パスワードは 128 文字以下にしてください"),
  name: z.string().min(1, "名前を入力してください").max(64),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function signUp(input: unknown): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "入力内容に誤りがあります", fieldErrors };
  }

  const { email, password, name } = parsed.data;

  try {
    const hashedPassword = await hashPassword(password);
    await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        preference: {
          create: {
            visibleColumns: [
              "title",
              "publishedAt",
              "views",
              "spread",
              "duration",
            ] as Prisma.InputJsonValue,
          },
        },
        watchlist: { create: {} },
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        ok: false,
        message: "このメールアドレスは既に登録されています",
      };
    }
    console.error("signUp failed:", e);
    return { ok: false, message: "登録処理に失敗しました" };
  }

  // Verification token を発行してメール送信
  try {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });
    await sendVerificationEmail(email, token);
  } catch (e) {
    console.error("verification email send failed:", e);
    // ユーザー作成は成功している。メール送信失敗は別途リトライ機構が必要だが MVP では報告のみ
    return {
      ok: true,
      message:
        "登録は完了しましたが、確認メールの送信に失敗しました。サポートまでご連絡ください。",
    };
  }

  return {
    ok: true,
    message: "確認メールを送信しました。受信トレイをご確認ください。",
  };
}

// ──────────────────────────────────────────────────────────
// Verify Email
// ──────────────────────────────────────────────────────────

export async function verifyEmail(token: string): Promise<ActionResult> {
  if (!token || typeof token !== "string") {
    return { ok: false, message: "リンクが無効です" };
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });
  if (!record) {
    return { ok: false, message: "リンクが無効です" };
  }
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { ok: false, message: "リンクの有効期限が切れています" };
  }
  // identifier が "reset:..." で始まる場合はパスワードリセット用なので拒否
  if (record.identifier.startsWith("reset:")) {
    return { ok: false, message: "リンクが無効です" };
  }

  await prisma.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  });
  await prisma.verificationToken.delete({ where: { token } });

  return { ok: true, message: "メールアドレスが確認されました" };
}

// ──────────────────────────────────────────────────────────
// Password Reset
// ──────────────────────────────────────────────────────────

const resetRequestSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
});

export async function requestPasswordReset(
  input: unknown,
): Promise<ActionResult> {
  const parsed = resetRequestSchema.safeParse(input);
  // メアド存在を漏らさないため、入力エラー以外は常に ok を返す
  if (!parsed.success) {
    return { ok: false, message: "メールアドレスを正しく入力してください" };
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    try {
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await prisma.verificationToken.create({
        data: { identifier: `reset:${email}`, token, expires },
      });
      await sendPasswordResetEmail(email, token);
    } catch (e) {
      console.error("password reset email send failed:", e);
      // ここでも存在漏洩を避けるため成功扱い
    }
  }

  return {
    ok: true,
    message:
      "ご入力のメールアドレス宛にリセット用リンクを送信しました (登録がある場合)",
  };
}

const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "パスワードは 8 文字以上にしてください")
    .max(128),
});

export async function resetPassword(input: unknown): Promise<ActionResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "入力が無効です", fieldErrors };
  }

  const { token, newPassword } = parsed.data;
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });
  if (!record || !record.identifier.startsWith("reset:")) {
    return { ok: false, message: "リンクが無効です" };
  }
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { ok: false, message: "リンクの有効期限が切れています" };
  }

  const email = record.identifier.slice("reset:".length);
  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { email },
    data: { hashedPassword },
  });
  await prisma.verificationToken.delete({ where: { token } });

  return { ok: true, message: "パスワードを更新しました" };
}
