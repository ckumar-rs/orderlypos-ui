"use client";

import {
  CalendarClock,
  ChefHat,
  FolderTree,
  Percent,
  Puzzle,
  ScanBarcode,
  Store,
  TrendingUp,
  Trees,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type MenuNavId =
  | "dishes"
  | "addons"
  | "channels"
  | "scheduling"
  | "kitchen"
  | "sku"
  | "seasons"
  | "prices"
  | "dynamic";

const TABS: {
  id: MenuNavId;
  label: string;
  description: string;
  href: string;
  icon: typeof FolderTree;
  manageOnly?: boolean;
  section?: "dishes" | "addons" | "channels" | "scheduling" | "kitchen";
}[] = [
  {
    id: "dishes",
    label: "Categories & dishes",
    description: "Browse categories and manage items",
    href: "/menu",
    icon: FolderTree,
    section: "dishes",
  },
  {
    id: "addons",
    label: "Add-ons & modifiers",
    description: "Modifier groups and extras",
    href: "/menu?tab=addons",
    icon: Puzzle,
    manageOnly: true,
    section: "addons",
  },
  {
    id: "channels",
    label: "Channel pricing",
    description: "Markups and platforms",
    href: "/menu?tab=channels",
    icon: Store,
    manageOnly: true,
    section: "channels",
  },
  {
    id: "scheduling",
    label: "Menu scheduling",
    description: "Breakfast, lunch, dinner sets",
    href: "/menu?tab=scheduling",
    icon: CalendarClock,
    manageOnly: true,
    section: "scheduling",
  },
  {
    id: "kitchen",
    label: "Kitchen setup",
    description: "Stations and courses",
    href: "/menu?tab=kitchen",
    icon: ChefHat,
    manageOnly: true,
    section: "kitchen",
  },
  {
    id: "sku",
    label: "SKUs",
    description: "Search and edit item codes",
    href: "/menu/sku",
    icon: ScanBarcode,
  },
  {
    id: "seasons",
    label: "Seasonal menus",
    description: "Dated holiday and season sets",
    href: "/menu/seasons",
    icon: Trees,
  },
  {
    id: "prices",
    label: "Scheduled prices",
    description: "Time-window menu price rules",
    href: "/menu/prices",
    icon: Percent,
  },
  {
    id: "dynamic",
    label: "Stock & demand",
    description: "Auto price from stock or sales",
    href: "/menu/dynamic",
    icon: TrendingUp,
  },
];

export function MenuSectionNav({
  canManage,
  activeSection,
  onSectionChange,
}: {
  canManage: boolean;
  /** When on /menu, which in-page section is active. */
  activeSection?: "dishes" | "addons" | "channels" | "scheduling" | "kitchen";
  onSectionChange?: (section: "dishes" | "addons" | "channels" | "scheduling" | "kitchen") => void;
}) {
  const pathname = usePathname();
  const tabs = TABS.filter((tab) => !tab.manageOnly || canManage);

  const isActive = (tab: (typeof TABS)[number]) => {
    const pathOnly = tab.href.split("?")[0];
    if (pathOnly !== "/menu") {
      return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
    }
    if (pathname === "/menu" || pathname === "/menu/") {
      return Boolean(tab.section && activeSection === tab.section);
    }
    return false;
  };

  return (
    <Card className="flex h-fit flex-col gap-1 p-2 sm:p-3 lg:sticky lg:top-4">
      <p className="px-2 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Menu sections
      </p>
      <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab);
          const className = cn(
            "flex min-w-[9.5rem] shrink-0 items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors lg:min-w-0 lg:w-full",
            active
              ? "bg-accent text-accent-foreground ring-1 ring-primary/20"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          );

          if (tab.section && onSectionChange && (pathname === "/menu" || pathname === "/menu/")) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSectionChange(tab.section!)}
                className={className}
              >
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", active && "text-primary")} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{tab.label}</span>
                  <span className="mt-0.5 hidden text-[11px] leading-snug opacity-80 lg:block">
                    {tab.description}
                  </span>
                </span>
              </button>
            );
          }

          return (
            <Link key={tab.id} href={tab.href} className={className}>
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", active && "text-primary")} />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{tab.label}</span>
                <span className="mt-0.5 hidden text-[11px] leading-snug opacity-80 lg:block">
                  {tab.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
