"use client";

import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { useNavBadges } from "@/hooks/use-nav-badges";
import { useBranch } from "@/hooks/use-branch";
import { useSettings } from "@/hooks/use-settings";
import { NavDot } from "@/components/layout/nav-dot";
import { ModuleSectionNav } from "@/components/layout/module-section-nav";

interface SettingsTab {
  label: string;
  href: string;
  description?: string;
  /** Omit to show the tab to anyone who can reach /settings at all. */
  permission?: string;
  /** Only shown for branches in this country (ISO code). */
  country?: string;
}

const TABS: SettingsTab[] = [
  { label: "Profile", href: "/settings/profile", description: "Your account" },
  { label: "General", href: "/settings", description: "Restaurant and branch" },
  { label: "Staff", href: "/settings/staff", permission: "users.manage", description: "Users and access" },
  { label: "Roles", href: "/settings/roles", permission: "roles.manage", description: "Permissions" },
  { label: "Audit log", href: "/settings/audit-log", permission: "audit_log.view", description: "Change history" },
  { label: "Backup", href: "/settings/backup", permission: "backup.manage", description: "Data backup" },
  { label: "Updates", href: "/settings/updates", permission: "system.update", description: "System updates" },
  { label: "API keys", href: "/settings/api-keys", description: "Integrations" },
  { label: "Security", href: "/settings/security", description: "Locks and policies" },
  { label: "Webhooks", href: "/settings/webhooks", permission: "settings.manage", description: "Event hooks" },
  { label: "Food platforms", href: "/settings/food-platforms", permission: "settings.manage", description: "Zomato / Swiggy" },
  { label: "WhatsApp catalog", href: "/settings/whatsapp-catalog", permission: "settings.manage", description: "Catalog sync" },
  { label: "Payments", href: "/settings/payments", permission: "settings.manage", description: "Pay methods" },
  { label: "Card terminals", href: "/settings/terminals", permission: "settings.manage", description: "Card devices" },
  { label: "House accounts", href: "/settings/house", permission: "settings.manage", description: "On-account guests" },
  { label: "Fleet", href: "/settings/fleet", permission: "settings.manage", description: "Delivery fleet" },
  { label: "Currencies", href: "/settings/currencies", permission: "settings.manage", description: "Multi-currency" },
  { label: "Brands", href: "/settings/brands", permission: "settings.manage", description: "Brand profiles" },
  { label: "Apps", href: "/settings/apps", permission: "settings.manage", description: "Connected apps" },
  { label: "Catalog", href: "/settings/catalog", permission: "settings.manage", description: "Catalog tools" },
  { label: "Developer", href: "/settings/developer", permission: "settings.manage", description: "Dev tools" },
  { label: "Devices", href: "/settings/devices", permission: "settings.manage", description: "POS devices" },
  { label: "Network", href: "/settings/network", permission: "settings.manage", description: "LAN and offline" },
  { label: "Fields", href: "/settings/fields", permission: "settings.manage", description: "Custom fields" },
  { label: "Automation", href: "/settings/automation", permission: "settings.manage", description: "Rules and jobs" },
  { label: "VERI*FACTU", href: "/settings/verifactu", permission: "settings.manage", country: "ES", description: "Spain fiscal" },
];

export function SettingsTabs() {
  const { data } = useCurrentUser();
  const user = data?.user;
  const badges = useNavBadges();
  const { branchId } = useBranch();
  const branchCountry = useSettings(branchId).data?.branch.country;

  const visibleTabs = TABS.filter(
    (tab) =>
      (!tab.permission || hasPermission(user, tab.permission)) &&
      (!tab.country || branchCountry === tab.country),
  ).map((tab) => ({
    href: tab.href,
    label: tab.label,
    description: tab.description,
    exact: tab.href === "/settings",
    endSlot: badges.settingsTabs[tab.href] ? <NavDot className="ml-0" /> : null,
  }));

  return <ModuleSectionNav title="Settings" items={visibleTabs} />;
}
