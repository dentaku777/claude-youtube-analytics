import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Server Action / Server Component で必須の認証セッションを取得する。
 * 未認証なら /login にリダイレクト。
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user;
}
