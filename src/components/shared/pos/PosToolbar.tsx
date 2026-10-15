import { cn } from "@/lib/utils";

export function PosToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-xl border border-border bg-transparent p-3 sm:p-4 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PosToolbarGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-wrap items-end gap-3", className)}>
      {children}
    </div>
  );
}

export function PosToolbarActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0 flex-wrap gap-2", className)}>
      {children}
    </div>
  );
}
