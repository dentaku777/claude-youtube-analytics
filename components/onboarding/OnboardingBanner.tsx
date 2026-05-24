"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight } from "lucide-react";

const STORAGE_KEY = "ya-onboarding-dismissed-v1";

export interface OnboardingBannerProps {
  hasApiKey: boolean;
  watchlistCount: number;
}

/**
 * 簡易オンボーディングガイド (F-UI-07 の簡易版)。
 * 3 ステップ: ①API キー → ②Watchlist 登録 → ③Insights 確認
 * localStorage で dismiss 永続化。
 */
export function OnboardingBanner({
  hasApiKey,
  watchlistCount,
}: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(true); // 初期は SSR ハイドレーション安全のため非表示

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  // すべて達成済みなら表示しない
  if (dismissed || (hasApiKey && watchlistCount > 0)) return null;

  const step = !hasApiKey ? 1 : watchlistCount === 0 ? 2 : 3;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="relative rounded-lg border border-lime-500/20 bg-lime-500/5 p-4">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-foreground"
        aria-label="閉じる"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-lime-400" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            はじめに ({step} / 3)
          </p>
          <ol className="mt-2 space-y-1 text-xs">
            <Step done={hasApiKey} active={step === 1}>
              YouTube Data API キーを{" "}
              <Link href="/settings" className="underline hover:text-lime-400">
                /settings
              </Link>{" "}
              で登録
            </Step>
            <Step done={watchlistCount > 0} active={step === 2}>
              注視チャンネルを{" "}
              <Link href="/watchlist" className="underline hover:text-lime-400">
                /watchlist
              </Link>{" "}
              に追加
            </Step>
            <Step done={false} active={step === 3}>
              <Link href="/insights" className="underline hover:text-lime-400">
                /insights
              </Link>{" "}
              で横断インサイトを確認
            </Step>
          </ol>
          <div className="mt-3">
            {step === 1 && (
              <Link
                href="/settings"
                className="inline-flex items-center gap-1 rounded-md bg-lime-400 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-lime-300"
              >
                API キーを登録 <ArrowRight className="h-3 w-3" />
              </Link>
            )}
            {step === 2 && (
              <Link
                href="/watchlist"
                className="inline-flex items-center gap-1 rounded-md bg-lime-400 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-lime-300"
              >
                Watchlist へ <ArrowRight className="h-3 w-3" />
              </Link>
            )}
            {step === 3 && (
              <Link
                href="/insights"
                className="inline-flex items-center gap-1 rounded-md bg-lime-400 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-lime-300"
              >
                Insights へ <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({
  done,
  active,
  children,
}: {
  done: boolean;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={
        done
          ? "text-zinc-600 line-through"
          : active
            ? "text-foreground"
            : "text-zinc-500"
      }
    >
      {done ? "✓ " : active ? "→ " : "  "}
      {children}
    </li>
  );
}
