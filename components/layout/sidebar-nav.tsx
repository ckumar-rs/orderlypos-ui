"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquareArrowOutUpRight } from "lucide-react";
import type { SessionUser } from "@nodedr-restaurant/types";
import { hasPermission } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useNavBadges } from "@/hooks/use-nav-badges";
import { NavDot } from "./nav-dot";
import {
  FLOOR_WINDOW_NAME,
  NAV_ITEMS,
  openNavHref,
  type NavGroup,
  type NavItem,
} from "./nav-items";

function currentNavGroup(pathname: string | null): NavGroup | null {
  if (!pathname) return null;
  const match = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.group ?? null;
}

function NavLink({
  item,
  isActive,
  label,
  badge,
  onWorkspace,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  label: string;
  badge: boolean;
  /** True when this browser tab is already a workspace screen. */
  onWorkspace: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const className = cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
  );

  if (item.openInNewTab) {
    return (
      <a
        href={item.href}
        className={className}
        aria-current={isActive ? "page" : undefined}
        title={`${label} — opens in another tab`}
        onClick={(event) => {
          // Keep the floor (POS) tab; reuse one tab per workspace area.
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
            onNavigate?.();
            return;
          }
          event.preventDefault();
          openNavHref(item.href, true);
          onNavigate?.();
        }}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <SquareArrowOutUpRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
        {badge && !isActive ? <NavDot /> : null}
      </a>
    );
  }

  // From Inventory/Settings, Floor links jump back to the floor tab instead of replacing this one.
  if (onWorkspace) {
    return (
      <a
        href={item.href}
        className={className}
        aria-current={isActive ? "page" : undefined}
        title={`${label} — floor tab`}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
            onNavigate?.();
            return;
          }
          event.preventDefault();
          const tab = window.open(item.href, FLOOR_WINDOW_NAME);
          if (tab) tab.opener = null;
          onNavigate?.();
        }}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {badge && !isActive ? <NavDot /> : null}
      </a>
    );
  }

  return (
    <Link href={item.href} onClick={onNavigate} className={className} aria-current={isActive ? "page" : undefined}>
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge && !isActive ? <NavDot /> : null}
    </Link>
  );
}

function NavSection({
  title,
  items,
  pathname,
  badges,
  t,
  onWorkspace,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string | null;
  badges: ReturnType<typeof useNavBadges>;
  t: (key: string) => string;
  onWorkspace: boolean;
  onNavigate?: () => void;
}) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/45">
        {title}
      </p>
      {items.map((item) => {
        const isActive = Boolean(pathname?.startsWith(item.href));
        return (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive}
            label={t(item.labelKey)}
            badge={Boolean(badges.nav[item.href])}
            onWorkspace={onWorkspace}
            onNavigate={onNavigate}
          />
        );
      })}
    </div>
  );
}

export function SidebarNav({
  user,
  onNavigate,
}: {
  user?: SessionUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const badges = useNavBadges();

  const allowed = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(user, item.permission),
  );
  const byGroup = (group: NavGroup) => allowed.filter((item) => item.group === group);
  const onWorkspace = currentNavGroup(pathname) === "workspace";

  return (
    <nav className="flex flex-col gap-1 px-3 pb-4" aria-label="Main">
      <NavSection
        title={t("nav.group.floor")}
        items={byGroup("floor")}
        pathname={pathname}
        badges={badges}
        t={t}
        onWorkspace={onWorkspace}
        onNavigate={onNavigate}
      />
      <NavSection
        title={t("nav.group.workspace")}
        items={byGroup("workspace")}
        pathname={pathname}
        badges={badges}
        t={t}
        onWorkspace={onWorkspace}
        onNavigate={onNavigate}
      />
    </nav>
  );
}
