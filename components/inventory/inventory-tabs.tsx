"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Ingredients", href: "/inventory" },
  { label: "Suppliers", href: "/inventory/suppliers" },
  { label: "Purchase Orders", href: "/inventory/purchase-orders" },
  { label: "Procurement", href: "/inventory/procurement" },
  { label: "Transfers", href: "/inventory/transfers" },
  { label: "Waste", href: "/inventory/waste" },
  { label: "Counts", href: "/inventory/counts" },
  { label: "Yield", href: "/inventory/yield" },
  { label: "Prep", href: "/inventory/prep" },
  { label: "Price variance", href: "/inventory/price-variance" },
  { label: "Forecast", href: "/inventory/forecast" },
  { label: "Food cost", href: "/inventory/cost" },
  { label: "Units", href: "/inventory/units" },
  { label: "Recipes", href: "/inventory/recipes" },
  { label: "Engineering", href: "/inventory/engineering" },
  { label: "Anomalies", href: "/inventory/anomalies" },
  { label: "Alerts", href: "/inventory/alerts" },
];

export function InventoryTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-border">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/inventory" ? pathname === "/inventory" : pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-3 pb-3 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
