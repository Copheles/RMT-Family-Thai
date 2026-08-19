import { cn } from "@/lib/utils";
import type { StockStatus } from "@/lib/stockStatus";

const STATUS_STYLES: Record<StockStatus, string> = {
  OUT_OF_STOCK: "bg-destructive/10 text-destructive",
  LOW_STOCK: "bg-warning text-warning-foreground",
  IN_STOCK: "bg-success text-success-foreground",
};

const STATUS_LABELS: Record<StockStatus, string> = {
  OUT_OF_STOCK: "Out of stock",
  LOW_STOCK: "Low stock",
  IN_STOCK: "In stock",
};

export function StockStatusBadge({
  status,
  className,
}: {
  status: StockStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
