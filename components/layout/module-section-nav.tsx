"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ModuleNavItem = {
  href: string;
  label: string;
  description?: string;
  /** When true, only exact path matches (for module roots). */
  exact?: boolean;
  endSlot?: React.ReactNode;
};

export type ModuleLocalNavItem = {
  id: string;
  label: string;
  description?: string;
  endSlot?: React.ReactNode;
};

function NavShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex h-fit flex-col gap-1 p-2 sm:p-3 lg:sticky lg:top-4">
      <p className="px-2 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      <div className="flex gap-1 overflow-x-auto pb-1 lg:max-h-[calc(100dvh-8rem)] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0">
        {children}
      </div>
    </Card>
  );
}

const itemClass = (active: boolean) =>
  cn(
    "flex min-w-[9.5rem] shrink-0 items-start gap-2 rounded-xl px-3 py-2.5 text-left transition-colors lg:min-w-0 lg:w-full",
    active
      ? "bg-accent text-accent-foreground ring-1 ring-primary/20"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
  );

export function ModuleSectionNav({
  title = "Sections",
  items,
}: {
  title?: string;
  items: ModuleNavItem[];
}) {
  const pathname = usePathname();

  return (
    <NavShell title={title}>
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : item.href === pathname || Boolean(pathname?.startsWith(`${item.href}/`));
        return (
          <Link key={item.href} href={item.href} className={itemClass(active)}>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-medium">
                {item.label}
                {item.endSlot}
              </span>
              {item.description ? (
                <span className="mt-0.5 hidden text-[11px] leading-snug opacity-80 lg:block">
                  {item.description}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </NavShell>
  );
}

/** Same look as ModuleSectionNav, for in-page tabs (no route change). */
export function ModuleLocalSectionNav({
  title = "Sections",
  items,
  value,
  onChange,
}: {
  title?: string;
  items: ModuleLocalNavItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <NavShell title={title}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={itemClass(active)}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-medium capitalize">
                {item.label}
                {item.endSlot}
              </span>
              {item.description ? (
                <span className="mt-0.5 hidden text-[11px] leading-snug opacity-80 lg:block">
                  {item.description}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </NavShell>
  );
}

