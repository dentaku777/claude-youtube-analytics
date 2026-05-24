import { Badge } from "@/components/ui/badge";
import { auth } from "@/auth";
import { getDailyQuota } from "@/lib/youtube/quota/tracker";
import {
  DAILY_QUOTA_LIMIT,
  QUOTA_WARNING_THRESHOLD,
} from "@/lib/youtube/quota/cost";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * YouTube API Quota 残量バナー (要件 F-UI-09)。
 * 残量 < QUOTA_WARNING_THRESHOLD で赤色化。
 * リセット: JST 17:00 (= PST 0:00)。
 */
export async function QuotaBanner() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const snapshot = await getDailyQuota(session.user.id);
  const warning = snapshot.remaining < QUOTA_WARNING_THRESHOLD;
  const ratioPercent = Math.round(snapshot.ratio * 100);

  return (
    <div className="flex items-center justify-end gap-3 border-b border-border px-6 py-2 text-xs text-muted-foreground">
      <span className="hidden sm:inline">YouTube API Quota (今日)</span>
      <div className="flex items-center gap-2">
        {/* プログレスバー */}
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={cn(
              "h-full transition-all",
              warning ? "bg-red-500" : ratioPercent > 70 ? "bg-amber-400" : "bg-lime-400",
            )}
            style={{ width: `${ratioPercent}%` }}
          />
        </div>
        <Badge
          variant="outline"
          className={cn(
            "font-mono tabular-nums",
            warning
              ? "border-red-500/50 bg-red-500/10 text-red-400"
              : "border-zinc-700 text-zinc-400",
          )}
        >
          {formatNumber(snapshot.used)} / {formatNumber(DAILY_QUOTA_LIMIT)}
        </Badge>
      </div>
      <span className="hidden text-zinc-600 md:inline">
        リセット: JST 17:00
      </span>
    </div>
  );
}
