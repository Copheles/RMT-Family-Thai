import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { Popover } from "radix-ui";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isValid, parse, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";

type PosDatePickerMode = "date" | "datetime";

interface PosDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  mode?: PosDatePickerMode;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

function parseValue(value: string, mode: PosDatePickerMode): Date | undefined {
  if (!value) return undefined;
  if (mode === "date") {
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  }
  const normalized = value.length === 16 ? `${value}:00` : value;
  const parsed = parseISO(normalized);
  return isValid(parsed) ? parsed : undefined;
}

function formatDisplay(value: string, mode: PosDatePickerMode): string {
  const date = parseValue(value, mode);
  if (!date) return "";
  if (mode === "date") return format(date, "dd MMM yyyy");
  return format(date, "dd MMM yyyy · HH:mm");
}

function toDateValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function toDateTimeValue(date: Date, time: string): string {
  const safeTime = /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  return `${format(date, "yyyy-MM-dd")}T${safeTime}`;
}

function extractTime(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(value);
  return match?.[2] ?? format(new Date(), "HH:mm");
}

const navButtonClass =
  "absolute top-0 z-10 inline-flex size-8 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

export function PosDatePicker({
  value,
  onChange,
  mode = "date",
  placeholder = "Select date",
  disabled,
  id,
  className,
}: PosDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseValue(value, mode), [value, mode]);
  const [month, setMonth] = useState<Date>(() => selected ?? new Date());
  const [draftTime, setDraftTime] = useState(() =>
    mode === "datetime" ? extractTime(value || "") : "00:00",
  );

  const display = formatDisplay(value, mode);

  function handleSelect(day: Date | undefined) {
    if (!day) return;
    if (mode === "date") {
      onChange(toDateValue(day));
      setOpen(false);
      return;
    }
    onChange(toDateTimeValue(day, draftTime));
  }

  function handleTimeChange(nextTime: string) {
    setDraftTime(nextTime);
    const day = selected ?? new Date();
    onChange(toDateTimeValue(day, nextTime));
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setMonth(selected ?? new Date());
      if (mode === "datetime") {
        setDraftTime(extractTime(value || ""));
      }
    }
    setOpen(next);
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "relative flex h-10 w-full min-w-0 items-center rounded-lg border border-input bg-background py-2 pl-3 pr-9 text-left text-sm leading-normal shadow-xs transition-all hover:border-ring/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className={cn("min-w-0 flex-1 truncate", !display && "text-muted-foreground")}>
            {display || placeholder}
          </span>
          <CalendarIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-100 w-auto rounded-xl border border-border/70 bg-card p-3 text-card-foreground shadow-lg outline-none"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            navLayout="around"
            showOutsideDays
            className="rdp-root"
            classNames={{
              root: "text-sm",
              months: "flex flex-col",
              month: "relative space-y-3",
              month_caption: "flex h-8 items-center justify-center px-10",
              caption_label: "pointer-events-none text-sm font-semibold text-foreground",
              button_previous: cn(navButtonClass, "left-0"),
              button_next: cn(navButtonClass, "right-0"),
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday:
                "w-9 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
              week: "mt-1 flex w-full",
              day: "relative p-0 text-center",
              day_button:
                "inline-flex size-9 items-center justify-center rounded-lg text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
              selected:
                "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
              today: "[&>button]:font-bold [&>button]:text-primary",
              outside: "[&>button]:text-muted-foreground/45",
              disabled: "[&>button]:opacity-40",
            }}
            components={{
              Chevron: ({ orientation, className: chevronClassName, ...props }) =>
                orientation === "left" ? (
                  <ChevronLeft className={cn("size-4", chevronClassName)} {...props} />
                ) : (
                  <ChevronRight className={cn("size-4", chevronClassName)} {...props} />
                ),
            }}
          />

          {mode === "datetime" ? (
            <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3">
              <label className="text-xs font-semibold text-muted-foreground">Time</label>
              <Input
                type="time"
                value={draftTime}
                onChange={(event) => handleTimeChange(event.target.value)}
                className="h-9"
              />
              <Button type="button" size="sm" className="ml-auto" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
