"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export interface LoginResult {
  ok: boolean;
  message?: string;
}

export async function loginAction(formData: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  try {
    await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirectTo: "/search",
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          ok: false,
          message: "メールアドレスまたはパスワードが正しくありません",
        };
      }
      // authorize 内で throw した EMAIL_NOT_VERIFIED を判定
      const cause = (error.cause as { err?: Error } | undefined)?.err;
      if (cause?.message === "EMAIL_NOT_VERIFIED") {
        return {
          ok: false,
          message:
            "メールアドレスの確認が完了していません。受信トレイをご確認ください。",
        };
      }
      return { ok: false, message: "ログインに失敗しました" };
    }
    // Next.js のリダイレクトエラーは再 throw
    throw error;
  }
}

export async function googleLoginAction() {
  await signIn("google", { redirectTo: "/search" });
}
