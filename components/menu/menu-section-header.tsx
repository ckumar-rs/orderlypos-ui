import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared chrome for Menu page section cards — theme tokens only. */
export function MenuSectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
