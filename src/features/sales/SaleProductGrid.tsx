import { useMemo, type RefObject } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SaleProductCard } from "@/components/shared/pos/SaleProductCard";
import type { ThaiProduct } from "@/features/thai/thai.types";
import { useMediaQuery } from "@/hooks/useMediaQuery";

function useProductGridColumns(): number {
  const is2xl = useMediaQuery("(min-width: 1536px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const isLg = useMediaQuery("(min-width: 1024px)");
  const isSm = useMediaQuery("(min-width: 640px)");

  if (is2xl) return 4;
  if (isXl) return 3;
  if (isLg) return 2;
  if (isSm) return 3;
  return 2;
}

interface SaleProductGridProps {
  products: ThaiProduct[];
  scrollRef: RefObject<HTMLDivElement | null>;
  onAdd: (productId: string) => void;
}

export function SaleProductGrid({ products, scrollRef, onAdd }: SaleProductGridProps) {
  const columns = useProductGridColumns();
  const rows = useMemo(() => {
    const result: ThaiProduct[][] = [];
    for (let i = 0; i < products.length; i += columns) {
      result.push(products.slice(i, i + columns));
    }
    return result;
  }, [products, columns]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 152,
    overscan: 4,
  });

  return (
    <div
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: "relative",
        width: "100%",
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const rowProducts = rows[virtualRow.index] ?? [];
        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            className="grid gap-2 pb-2"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {rowProducts.map((product) => (
              <SaleProductCard
                key={product.id}
                productId={product.id}
                name={product.name}
                stockQty={product.stockQty}
                sku={product.productCode}
                onAdd={onAdd}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
