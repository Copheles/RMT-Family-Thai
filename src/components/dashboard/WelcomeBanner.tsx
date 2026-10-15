import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type WelcomeBannerProps = {
  description: string;
  className?: string;
};

export function WelcomeBanner({ description, className }: WelcomeBannerProps) {
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const greeting = getGreeting(now.getHours());
  const dateLabel = formatDate(now);
  const timeLabel = formatTime(now);

  return (
    <div
      className={cn(
        "mb-6 rounded-2xl border border-border bg-transparent px-5 py-5 sm:px-6 sm:py-6",
        className,
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {greeting}
          </p>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            Welcome back, {user?.username ?? "User"}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="shrink-0 border-t border-border pt-4 sm:border-t-0 sm:border-l sm:pl-8 sm:pt-0 sm:text-right">
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
          <time
            dateTime={now.toISOString()}
            className="mt-1 block font-mono text-2xl font-medium tabular-nums tracking-tight text-foreground sm:text-3xl"
          >
            {timeLabel}
          </time>
        </div>
      </div>
    </div>
  );
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}
