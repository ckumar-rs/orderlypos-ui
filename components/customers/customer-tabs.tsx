"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Customers", href: "/customers" },
  { label: "Analytics", href: "/customers/analytics" },
  { label: "Loyalty rules", href: "/customers/loyalty" },
  { label: "Rewards", href: "/customers/rewards" },
  { label: "Staff discounts", href: "/customers/staff-discounts" },
];

export function CustomerTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b border-border">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/customers"
            ? pathname === "/customers"
            : pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
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
