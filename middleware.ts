import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge ランタイム対応版 (Prisma を含まない) で middleware を構成
export const { auth: middleware } = NextAuth(authConfig);

// 設計書 §5.3: 認証必須パス
export const config = {
  matcher: [
    "/search/:path*",
    "/compare/:path*",
    "/watchlist/:path*",
    "/insights/:path*",
    "/keywords/:path*",
    "/discover/:path*",
    "/settings/:path*",
    "/history/:path*",
  ],
};
