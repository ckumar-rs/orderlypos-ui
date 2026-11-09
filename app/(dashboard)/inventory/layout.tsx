"use client";

import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { ModulePageShell } from "@/components/layout/module-page-shell";

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModulePageShell
      title="Inventory"
      description="Ingredients, recipes, purchasing, and waste"
      nav={<InventoryTabs />}
    >
      {children}
    </ModulePageShell>
  );
}
