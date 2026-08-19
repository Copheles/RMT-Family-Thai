import { cn } from "@/lib/utils";

interface SaleProductCardProps {
  name: string;
  /** When omitted or 0, shows "Set in cart" instead of a price. */
  price?: number;
  stockQty: number;
  sku?: string;
  onAdd: () => void;
}

export function SaleProductCard({
  name,
  price,
  stockQty,
  sku,
  onAdd,
}: SaleProductCardProps) {
  const inStock = stockQty > 0;
  const lowStock = inStock && stockQty <= 5;
  const hasListPrice = typeof price === "number" && price > 0;

  const stockLabel = inStock ? `${stockQty} left` : "No stock";

  return (
    <button
      type="button"
      disabled={!inStock}
      onClick={onAdd}
      className={cn(
        "group flex min-h-[120px] flex-col rounded-xl border p-3 text-left transition-[border-color,background-color,box-shadow] duration-150 lg:min-h-[132px] lg:p-3.5 xl:min-h-[140px] xl:p-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
        inStock
          ? "cursor-pointer border-border/80 bg-card hover:border-primary/25 hover:bg-primary/[0.04] hover:shadow-sm active:scale-[0.99]"
          : "cursor-not-allowed border-dashed border-border/70 bg-muted/25",
      )}
    >
      <p
        className={cn(
          "line-clamp-2 flex-1 text-sm font-medium leading-snug sm:text-base lg:text-[17px] xl:text-lg",
          inStock ? "text-foreground/90" : "text-muted-foreground",
        )}
      >
        {name}
      </p>

      {sku && inStock && (
        <p className="mt-1 text-[10px] text-muted-foreground lg:text-[11px]">
          SKU: {sku}
        </p>
      )}

      <div
        className={cn(
          "relative mt-3 flex min-h-[2rem] items-end justify-between gap-2 border-t pt-3",
          inStock ? "border-border/50" : "border-border/40",
        )}
      >
        <span
          className={cn(
            "truncate text-sm font-semibold tracking-tight lg:text-base xl:text-[17px]",
            hasListPrice ? "tabular-nums text-foreground" : "text-muted-foreground",
          )}
        >
          {hasListPrice ? price.toLocaleString() : "Set in cart"}
        </span>

        {inStock ? (
          <span
            className={cn(
              "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium tabular-nums lg:text-xs",
              lowStock && "bg-amber-500/10 text-amber-800/90 dark:text-amber-200/90",
              !lowStock && "bg-muted/60 text-muted-foreground",
            )}
          >
            {stockLabel}
          </span>
        ) : (
          <span className="absolute bottom-0 right-0 shrink-0 rounded-md border border-destructive/20 bg-destructive/8 px-2 py-0.5 text-[10px] font-medium text-destructive/80 lg:text-xs">
            {stockLabel}
          </span>
        )}
      </div>
    </button>
  );
}
