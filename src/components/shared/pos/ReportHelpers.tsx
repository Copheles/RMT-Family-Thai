import type { LucideIcon } from "lucide-react";
import { formatMoneyShort } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PaymentBar({
  icon: Icon,
  label,
  amount,
  percent,
}: {
  icon: LucideIcon;
  label: string;
  amount: number;
  percent: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </span>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatMoneyShort(amount)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[var(--brand-card-accent)] transition-all"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

export function SummaryRow({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string | number;
  variant?: "default" | "negative" | "strong";
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-sm font-semibold tabular-nums",
          variant === "negative" && "text-destructive",
          variant === "strong" && "text-primary",
          variant === "default" && "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function RankBadge({ rank }: { rank: number }) {
  const isTop = rank <= 3;
  return (
    <span
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-lg text-xs font-bold",
        isTop
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground",
      )}
    >
      {rank}
    </span>
  );
}
