"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { useNavBadges } from "@/hooks/use-nav-badges";
import { useBranch } from "@/hooks/use-branch";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import { NavDot } from "@/components/layout/nav-dot";

interface SettingsTab {
  label: string;
  href: string;
  /** Omit to show the tab to anyone who can reach /settings at all. */
  permission?: string;
  /** Only shown for branches in this country (ISO code). */
  country?: string;
}

const TABS: SettingsTab[] = [
  { label: "General", href: "/settings" },
  { label: "Staff", href: "/settings/staff", permission: "users.manage" },
  { label: "Roles", href: "/settings/roles", permission: "roles.manage" },
  { label: "Audit Log", href: "/settings/audit-log", permission: "audit_log.view" },
  { label: "Backup", href: "/settings/backup", permission: "backup.manage" },
  { label: "Updates", href: "/settings/updates", permission: "system.update" },
  { label: "API Keys", href: "/settings/api-keys" },
  { label: "Security", href: "/settings/security" },
  { label: "Webhooks", href: "/settings/webhooks", permission: "settings.manage" },
  { label: "Food platforms", href: "/settings/food-platforms", permission: "settings.manage" },
  { label: "Payments", href: "/settings/payments", permission: "settings.manage" },
  { label: "Card terminals", href: "/settings/terminals", permission: "settings.manage" },
  { label: "House accounts", href: "/settings/house", permission: "settings.manage" },
  { label: "Fleet", href: "/settings/fleet", permission: "settings.manage" },
  { label: "Currencies", href: "/settings/currencies", permission: "settings.manage" },
  { label: "Brands", href: "/settings/brands", permission: "settings.manage" },
  { label: "Apps", href: "/settings/apps", permission: "settings.manage" },
  { label: "Catalog", href: "/settings/catalog", permission: "settings.manage" },
  { label: "Developer", href: "/settings/developer", permission: "settings.manage" },
  { label: "Devices", href: "/settings/devices", permission: "settings.manage" },
  { label: "Network", href: "/settings/network", permission: "settings.manage" },
  { label: "Fields", href: "/settings/fields", permission: "settings.manage" },
  { label: "Automation", href: "/settings/automation", permission: "settings.manage" },
  { label: "VERI*FACTU", href: "/settings/verifactu", permission: "settings.manage", country: "ES" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  const { data } = useCurrentUser();
  const user = data?.user;
  const badges = useNavBadges();
  const { branchId } = useBranch();
  const branchCountry = useSettings(branchId).data?.branch.country;

  const visibleTabs = TABS.filter(
    (tab) =>
      (!tab.permission || hasPermission(user, tab.permission)) &&
      (!tab.country || branchCountry === tab.country),
  );

  return (
    <nav className="flex flex-wrap gap-1 border-b border-border">
      {visibleTabs.map((tab) => {
        const isActive =
          tab.href === "/settings" ? pathname === "/settings" : pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {badges.settingsTabs[tab.href] ? <NavDot className="ml-0" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
