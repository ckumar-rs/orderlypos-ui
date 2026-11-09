"use client";

import { ModulePageShell } from "@/components/layout/module-page-shell";
import { TableSectionNav } from "@/components/tables/table-section-nav";

export default function TablesLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModulePageShell
      title="Tables"
      description="Floor plan, areas, moves, and history"
      nav={<TableSectionNav />}
    >
      {children}
    </ModulePageShell>
  );
}
