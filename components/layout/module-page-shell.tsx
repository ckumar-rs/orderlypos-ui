"use client";

import type { ReactNode } from "react";

/** Shared chrome for multi-section modules (side tabs + content). */
export function ModulePageShell({
  title,
  description,
  nav,
  actions,
  children,
}: {
  title: string;
  description?: string;
  nav: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]">
        {nav}
        <div className="min-w-0 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}
