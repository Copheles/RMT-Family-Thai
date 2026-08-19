import { useMemo, useState } from "react";
import { Popover } from "radix-ui";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ThaiCategory } from "@/features/thai/thai.types";
import { cn } from "@/lib/utils";

interface CategoryComboboxProps {
  options: ThaiCategory[];
  value: string;
  onChange: (categoryId: string, category: ThaiCategory | null) => void;
  placeholder?: string;
  emptyOptionLabel?: string;
  disabled?: boolean;
  id?: string;
  size?: "default" | "sm";
  className?: string;
}

export function CategoryCombobox({
  options,
  value,
  onChange,
  placeholder = "All categories",
  emptyOptionLabel,
  disabled,
  id,
  size = "default",
  className,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);

  const emptyLabel = emptyOptionLabel ?? placeholder;
  const selected = options.find((category) => category.id === value);
  const selectedLabel = selected?.name;

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return options;
    return options.filter((category) => category.name.toLowerCase().includes(q));
  }, [options, debouncedSearch]);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-label={placeholder}
          className={cn(
            "relative flex w-full min-w-0 items-center rounded-lg border border-input bg-background py-2 pl-3 pr-9 text-left leading-normal shadow-xs transition-all hover:border-ring/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
            size === "sm" ? "h-9 text-xs" : "h-10 text-sm",
            className,
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              !selectedLabel && "text-muted-foreground",
            )}
          >
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-(--radix-popover-trigger-width) overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md"
        >
          <div className="border-b border-border/60 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories..."
                className="h-9 pl-9"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => {
                onChange("", null);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted",
                value === "" && "bg-muted/60",
              )}
            >
              <span className="flex size-4 shrink-0 items-center justify-center">
                {value === "" && <Check className="size-4 text-primary" />}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {emptyLabel}
              </span>
            </button>

            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("", null);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
              >
                <X className="size-4 shrink-0" />
                Clear
              </button>
            )}

            {filtered.length === 0 && debouncedSearch && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No categories found
              </p>
            )}

            {filtered.map((category) => {
              const isSelected = category.id === value;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    onChange(category.id, category);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted",
                    isSelected && "bg-muted/60",
                  )}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {isSelected && <Check className="size-4 text-primary" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
