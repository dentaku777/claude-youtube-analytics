import type { KeywordFreqRow } from "@/lib/insights/keyword-analyzer";

export function KeywordFreqTable({ rows }: { rows: KeywordFreqRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-sm text-muted-foreground">
        対象動画が少ないため頻出語を抽出できませんでした
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        勝ち動画タイトル頻出語 TOP {rows.length}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-muted-foreground">
              <th className="px-3 py-2 text-left">語</th>
              <th className="px-3 py-2 text-right">勝ち動画内</th>
              <th className="px-3 py-2 text-right">全動画内</th>
              <th className="px-3 py-2 text-right">出現率</th>
              <th className="px-3 py-2 text-right">ヒット占有</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.word} className="border-b border-zinc-900">
                <td className="px-3 py-2 font-medium">{r.word}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {r.inHits}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                  {r.inAll}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-amber-400">
                  {(r.hitRate * 100).toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-lime-400">
                  {(r.hitShare * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">
        出現率: その語を含む動画のうちヒットした割合 / ヒット占有: ヒット動画のうち何 % にその語が含まれるか
      </p>
    </div>
  );
}
