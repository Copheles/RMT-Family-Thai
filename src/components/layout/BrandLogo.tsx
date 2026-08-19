import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  onClick?: () => void;
  compact?: boolean;
}

function BrandWordmark({
  showSubtitle = true,
  size = "md",
}: {
  showSubtitle?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        <p
          className={cn(
            "truncate font-bold tracking-tight",
            size === "sm" ? "text-sm" : "text-[15px] sm:text-base",
          )}
        >
          <span className="bg-gradient-to-r from-primary/80 via-primary to-primary bg-clip-text text-transparent">
            RMT Family
          </span>
        </p>
      </div>
      {showSubtitle && (
        <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Business Management
        </p>
      )}
    </div>
  );
}

export function BrandLogo({
  className,
  onClick,
  compact = false,
}: BrandLogoProps) {
  const Wrapper = onClick ? "button" : "div";

  const focusClass = onClick
    ? "rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
    : "";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn("min-w-0 text-left", focusClass, className)}
    >
      <BrandWordmark
        showSubtitle={!compact}
        size={compact ? "sm" : "md"}
      />
    </Wrapper>
  );
}
