import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge ランタイム (middleware) でも実行可能な設定のみここに置く。
 * PrismaAdapter や Credentials provider (Prisma を使う authorize) は auth.ts 側に分離。
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      const publicPrefixes = [
        "/login",
        "/signup",
        "/verify-email",
        "/reset-password",
        "/api/auth",
      ];
      const isPublic = publicPrefixes.some((p) => path.startsWith(p)) || path === "/";
      if (isPublic) return true;
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};
