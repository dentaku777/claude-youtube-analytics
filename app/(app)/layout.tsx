import { redirect } from "next/navigation";
import { ApiProvider } from "@prisma/client";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { QuotaBanner } from "@/components/layout/QuotaBanner";
import { OnboardingBanner } from "@/components/onboarding/OnboardingBanner";
import { hasApiKey } from "@/lib/api-keys/vault";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware で保護済みだが、二重ガード + session の取得用
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const [keyRegistered, watchlistCount] = await Promise.all([
    hasApiKey(userId, ApiProvider.YOUTUBE),
    prisma.watchlistChannel.count({
      where: { watchlist: { userId } },
    }),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar user={session.user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <QuotaBanner />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <OnboardingBanner
              hasApiKey={keyRegistered}
              watchlistCount={watchlistCount}
            />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
