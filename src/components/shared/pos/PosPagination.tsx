import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PaginatedMeta } from "@/types/api";

function buildPageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort(
    (a, b) => a - b,
  );

  const result: (number | "ellipsis")[] = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = sorted[index - 1];
    if (index > 0 && current - previous > 1) {
      result.push("ellipsis");
    }
    result.push(current);
  }

  return result;
}

export function PosPagination({
  page,
  totalPages,
  total,
  limit,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  className,
}: {
  page: number;
  totalPages: number;
  total?: number;
  limit?: number;
  pageSizeOptions?: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
  className?: string;
}) {
  const pageSize = limit ?? pageSizeOptions?.[0] ?? 20;
  const hasRows = (total ?? 0) > 0;
  const showPager = totalPages > 1;
  const showFooter =
    hasRows || Boolean(onPageSizeChange && pageSizeOptions?.length);

  if (!showFooter) return null;

  const start = hasRows ? (page - 1) * pageSize + 1 : 0;
  const end = hasRows ? Math.min(page * pageSize, total ?? 0) : 0;
  const pageNumbers = buildPageNumbers(page, totalPages);

  return (
    <div
      className={cn(
        "mt-4 flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-card sm:p-4 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        {hasRows
          ? `Showing ${start}–${end} of ${total} results`
          : "No results"}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">Rows per page</span>
            <Select
              value={String(pageSize)}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-9 min-w-[4.5rem] rounded-lg border-border/80 bg-background px-2.5 text-sm font-medium text-foreground"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>
        )}

        {showPager && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-lg"
              disabled={page <= 1}
              onClick={() => onPageChange(1)}
              aria-label="First page"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-lg"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <div className="hidden items-center gap-1 sm:flex">
              {pageNumbers.map((item, index) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-1 text-sm text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === page ? "default" : "outline"}
                    size="sm"
                    className="min-w-9 rounded-lg px-2"
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </Button>
                ),
              )}
            </div>

            <span className="px-2 text-xs font-semibold text-muted-foreground sm:hidden">
              {page} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-lg"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-lg"
              disabled={page >= totalPages}
              onClick={() => onPageChange(totalPages)}
              aria-label="Last page"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PosPaginationFromMeta({
  meta,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  className,
}: {
  meta: PaginatedMeta;
  onPageChange: (page: number) => void;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (limit: number) => void;
  className?: string;
}) {
  return (
    <PosPagination
      page={meta.page}
      totalPages={meta.totalPages}
      total={meta.total}
      limit={meta.limit}
      pageSizeOptions={pageSizeOptions}
      onPageSizeChange={onPageSizeChange}
      onPageChange={onPageChange}
      className={className}
    />
  );
}
