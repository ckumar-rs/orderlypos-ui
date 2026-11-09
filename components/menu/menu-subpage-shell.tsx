"use client";

import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { MenuSectionNav } from "@/components/menu/menu-section-nav";

export function MenuSubpageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { data: me } = useCurrentUser();
  const canManage = hasPermission(me?.user, "menu.manage");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]">
        <MenuSectionNav canManage={canManage} />
        <div className="min-w-0 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}
