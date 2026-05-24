import type { LucideIcon } from "lucide-react";

interface PlaceholderPanelProps {
  title: string;
  description: string;
  icon: LucideIcon;
  phase?: string;
}

export function PlaceholderPanel({
  title,
  description,
  icon: Icon,
  phase = "Phase 2",
}: PlaceholderPanelProps) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-zinc-900 text-zinc-700">
        <Icon className="h-7 w-7" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 font-mono text-xs text-lime-400">
        {phase} で実装予定
      </p>
    </div>
  );
}
