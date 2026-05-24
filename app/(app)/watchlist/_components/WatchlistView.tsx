"use client";

import { useState } from "react";
import { WatchlistTable, type WatchlistRow } from "./WatchlistTable";
import { EditMetaDialog } from "./EditMetaDialog";

export function WatchlistView({ rows }: { rows: WatchlistRow[] }) {
  const [editing, setEditing] = useState<WatchlistRow | null>(null);

  return (
    <>
      <WatchlistTable rows={rows} onEdit={(row) => setEditing(row)} />
      <EditMetaDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        channelId={editing?.channelId ?? null}
        channelTitle={editing?.channelTitle ?? ""}
        initialTags={editing?.tags ?? []}
        initialMemo={editing?.memo ?? ""}
      />
    </>
  );
}
