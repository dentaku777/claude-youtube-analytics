"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ArrowLeftRight,
  Star,
  BarChart3,
  Globe,
  Compass,
  History,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/_actions/auth";

const navItems = [
  { href: "/search", label: "検索", icon: Search },
  { href: "/compare", label: "比較", icon: ArrowLeftRight },
  { href: "/watchlist", label: "ウォッチリスト", icon: Star },
  { href: "/insights", label: "インサイト", icon: BarChart3 },
  { href: "/keywords", label: "キーワード", icon: Globe },
  { href: "/discover", label: "競合発見", icon: Compass },
  { href: "/history", label: "履歴", icon: History },
  { href: "/settings", label: "設定", icon: Settings },
] as const;

export interface SidebarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const displayName = user.name ?? user.email ?? "User";
  const initial = (user.email ?? user.name ?? "?")[0]?.toUpperCase() ?? "?";

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-zinc-950">
      {/* Logo */}
      <div className="border-b border-border px-4 py-4">
        <Link
          href="/search"
          className="block font-mono text-base font-bold tracking-tight text-lime-400"
        >
          ▰ Youtube Analyzer
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-zinc-800 text-lime-400"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User menu */}
      <div className="border-t border-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-zinc-900">
            <Avatar className="h-7 w-7">
              {user.image && <AvatarImage src={user.image} alt={displayName} />}
              <AvatarFallback className="bg-zinc-800 text-xs text-lime-400">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm text-foreground">{displayName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                設定
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOutAction}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
