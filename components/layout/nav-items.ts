import {
  ShieldCheck,
  CalendarClock,
  Clock,
  Truck,
  Users,
  Landmark,
  Receipt,
  BarChart3,
  MessageCircle,
  Megaphone,
  Wrench,
  ChefHat,
  LayoutDashboard,
  ClipboardList,
  LayoutGrid,
  Package,
  Settings,
  ShoppingCart,
  UsersRound,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/** Floor = service shift (same tab). Workspace = heavy screens (own browser tab). */
export type NavGroup = "floor" | "workspace";

export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  group: NavGroup;
  /** Open away from POS / floor so the service tab stays put. */
  openInNewTab?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard.sales.view", group: "floor" },
  { labelKey: "nav.pos", href: "/pos", icon: ShoppingCart, permission: "orders.create", group: "floor" },
  { labelKey: "nav.orders", href: "/orders", icon: ClipboardList, permission: "orders.create", group: "floor" },
  { labelKey: "nav.tables", href: "/tables", icon: LayoutGrid, permission: "tables.view", group: "floor" },
  {
    labelKey: "nav.reservations",
    href: "/reservations",
    icon: CalendarClock,
    permission: "reservations.manage",
    group: "floor",
  },
  { labelKey: "nav.kds", href: "/kds", icon: ChefHat, permission: "kds.manage", group: "floor" },
  { labelKey: "nav.approvals", href: "/approvals", icon: ShieldCheck, permission: "orders.cancel", group: "floor" },

  { labelKey: "nav.menu", href: "/menu", icon: UtensilsCrossed, permission: "menu.view", group: "workspace", openInNewTab: true },
  { labelKey: "nav.customers", href: "/customers", icon: UsersRound, permission: "customers.manage", group: "workspace", openInNewTab: true },
  { labelKey: "nav.inventory", href: "/inventory", icon: Package, permission: "inventory.manage", group: "workspace", openInNewTab: true },
  { labelKey: "nav.delivery", href: "/delivery", icon: Truck, permission: "delivery.manage", group: "workspace", openInNewTab: true },
  { labelKey: "nav.team", href: "/team", icon: Users, permission: "staff.manage", group: "workspace", openInNewTab: true },
  { labelKey: "nav.accounting", href: "/accounting", icon: Landmark, permission: "accounting.manage", group: "workspace", openInNewTab: true },
  { labelKey: "nav.gst", href: "/gst", icon: Receipt, permission: "accounting.manage", group: "workspace", openInNewTab: true },
  { labelKey: "nav.reports", href: "/reports", icon: BarChart3, permission: "reports.access", group: "workspace", openInNewTab: true },
  { labelKey: "nav.ask", href: "/agent", icon: MessageCircle, group: "workspace", openInNewTab: true },
  { labelKey: "nav.franchise", href: "/franchise", icon: BarChart3, permission: "reports.access", group: "workspace", openInNewTab: true },
  { labelKey: "nav.marketing", href: "/marketing", icon: Megaphone, permission: "marketing.manage", group: "workspace", openInNewTab: true },
  { labelKey: "nav.operations", href: "/operations", icon: Wrench, permission: "operations.manage", group: "workspace", openInNewTab: true },
  { labelKey: "nav.attendance", href: "/attendance", icon: Clock, group: "workspace", openInNewTab: true },
  { labelKey: "nav.settings", href: "/settings", icon: Settings, permission: "settings.manage", group: "workspace", openInNewTab: true },
];

export const FLOOR_WINDOW_NAME = "orderly_floor";

/** Reuse one browser tab per area so Inventory / Settings do not spawn endless tabs. */
export function workspaceWindowName(href: string) {
  const area = href.replace(/^\//, "").split("/")[0] || "app";
  return `orderly_${area}`;
}

export function openNavHref(href: string, openInNewTab?: boolean) {
  if (!openInNewTab || typeof window === "undefined") return false;
  // Named target reuses the same Inventory/Settings tab. Clear opener so the
  // new tab cannot script the floor tab (do not pass noopener — that breaks reuse).
  const tab = window.open(href, workspaceWindowName(href));
  if (tab) tab.opener = null;
  return true;
}
