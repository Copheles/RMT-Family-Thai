import type { ReactNode } from "react";

interface TableShellProps {
  children: ReactNode;
}

export function TableShell({ children }: TableShellProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {children}
    </div>
  );
}

