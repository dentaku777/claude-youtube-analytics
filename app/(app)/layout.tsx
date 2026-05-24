import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { QuotaBanner } from "@/components/layout/QuotaBanner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware で保護済みだが、二重ガード + session の取得用
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar user={session.user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <QuotaBanner />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
