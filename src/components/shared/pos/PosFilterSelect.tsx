import { PosSelect } from "@/components/shared/pos/PosSelect";
import { cn } from "@/lib/utils";

export function PosFilterSelect<T extends string>({
  value,
  options,
  onChange,
  getLabel,
  ariaLabel,
  className,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  getLabel: (value: T) => string;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <PosSelect
      aria-label={ariaLabel}
      value={value}
      onChange={onChange}
      options={options.map((option) => ({
        value: option,
        label: getLabel(option),
      }))}
      className={cn("sm:w-52", className)}
    />
  );
}
