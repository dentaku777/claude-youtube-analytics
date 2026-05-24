import { User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface AccountSectionProps {
  email: string;
  name?: string | null;
  createdAt: Date;
}

export function AccountSection({ email, name, createdAt }: AccountSectionProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-zinc-400" />
          アカウント
        </CardTitle>
        <CardDescription className="text-xs">
          基本情報の表示のみ (編集機能は MVP 後)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="メール" value={email} mono />
        <Row label="名前" value={name ?? "(未設定)"} />
        <Row
          label="登録日"
          value={new Intl.DateTimeFormat("ja-JP").format(new Date(createdAt))}
        />
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-800 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-zinc-300" : "text-zinc-300"}>
        {value}
      </span>
    </div>
  );
}
