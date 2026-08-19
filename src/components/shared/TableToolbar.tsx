import type { ReactNode } from "react";

interface TableToolbarProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  filters?: ReactNode;
}

export function TableToolbar({ title, description, actions, filters }: TableToolbarProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-card-foreground">{title}</h3>
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </div>
      {filters ? <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">{filters}</div> : null}
    </div>
  );
}
