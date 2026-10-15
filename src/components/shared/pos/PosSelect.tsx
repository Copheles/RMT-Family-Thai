import { useMemo, useState } from "react";
import { Popover } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type PosSelectOption<T extends string = string> = {
  value: T;
  label: string;
};

type PosSelectProps<T extends string> = {
  value: T;
  options: readonly PosSelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  "aria-label"?: string;
};

export function PosSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder = "Select...",
  disabled,
  className,
  triggerClassName,
  "aria-label": ariaLabel,
}: PosSelectProps<T>) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className={cn("w-full", className)}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(
              "flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm transition-colors",
              "hover:border-ring/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              open && "border-ring ring-2 ring-ring/20",
              triggerClassName,
            )}
          >
            <span
              className={cn(
                "truncate",
                selected ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {selected?.label ?? placeholder}
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            className="z-50 max-h-64 w-[var(--radix-popover-trigger-width)] overflow-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted",
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected ? (
                    <Check className="size-3.5 shrink-0 text-primary" />
                  ) : null}
                </button>
              );
            })}
          </Popover.Content>
        </Popover.Portal>
      </div>
    </Popover.Root>
  );
}
