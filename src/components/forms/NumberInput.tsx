import {
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
} from "react";
import { Input } from "@/components/ui/input";

const NUMERIC_PATTERN = /^\d*(\.\d*)?$/;

function formatDisplay(value: number): string {
  return String(value);
}

function normalizeTypingInput(next: string): string {
  if (next === "" || next === "0" || next.startsWith("0.")) {
    return next;
  }
  return next.replace(/^0+(?=\d)/, "");
}

function parseNumber(raw: string, min?: number): number {
  const fallback = min ?? 0;
  if (raw === "" || raw === ".") {
    return fallback;
  }
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  if (min !== undefined && parsed < min) {
    return min;
  }
  return parsed;
}

interface NumberInputProps
  extends Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange"> {
  value: number;
  onChange: (value: number) => void;
}

export function NumberInput({
  value,
  onChange,
  min,
  onFocus,
  onBlur,
  ...props
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState<string | null>(null);

  const displayValue = localValue !== null ? localValue : formatDisplay(value);

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setLocalValue(formatDisplay(value));
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const raw = localValue ?? formatDisplay(value);
    onChange(parseNumber(raw, typeof min === "number" ? min : undefined));
    setLocalValue(null);
    onBlur?.(event);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (!NUMERIC_PATTERN.test(next)) {
      return;
    }
    setLocalValue(normalizeTypingInput(next));
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      {...props}
    />
  );
}
