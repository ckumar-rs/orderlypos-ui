"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductFrame } from "@/components/site/product-frame";
import { cn } from "@/lib/utils";

const views = [
  {
    id: "dashboard",
    label: "Dashboard",
    src: "/site/admin-dashboard.png",
    alt: "Today’s revenue, orders, and tables on the dashboard",
    note: "Revenue, open orders, and occupied tables refresh when a bill or ticket changes.",
  },
  {
    id: "till",
    label: "Till",
    src: "/site/admin-pos.png",
    alt: "POS floor with free and occupied tables and open bills",
    note: "Tap a table to start or continue. Occupied tiles show open bills and seat time.",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    src: "/site/admin-kds.png",
    alt: "Kitchen display by station",
    note: "Tickets split across stations. A late ticket is marked on the pass.",
  },
  {
    id: "floor",
    label: "Floor",
    src: "/site/admin-tables.png",
    alt: "Floor plan with live table status",
    note: "Tables, moves, and areas stay on the floor plan for this branch.",
  },
  {
    id: "menu",
    label: "Menu",
    src: "/site/admin-menu.png",
    alt: "Menu editor for dishes and add-ons",
    note: "The same menu feeds till, table QR, kiosk, and WhatsApp.",
  },
  {
    id: "inventory",
    label: "Inventory",
    src: "/site/admin-inventory.png",
    alt: "Inventory stock and reorder levels",
    note: "Stock, recipes, waste, purchase orders, and food cost.",
  },
  {
    id: "delivery",
    label: "Delivery",
    src: "/site/admin-delivery.png",
    alt: "Delivery live map and drivers",
    note: "Live map, zones, drivers, and tracking for orders that left the restaurant.",
  },
  {
    id: "marketing",
    label: "Marketing",
    src: "/site/admin-marketing.png",
    alt: "Marketing coupons and campaigns",
    note: "Coupons, happy hour, campaigns, and buy-and-get rules.",
  },
  {
    id: "accounting",
    label: "Books",
    src: "/site/admin-accounting.png",
    alt: "Accounting expenses and journals",
    note: "Drawer, expenses, P&L, GST, and journals on the restaurant host.",
  },
  {
    id: "ask",
    label: "Ask",
    src: "/site/admin-agent.png",
    alt: "Ask agent reading the open branch",
    note: "Reads sales, tickets, and stock. Does not take a payment.",
  },
  {
    id: "reports",
    label: "Reports",
    src: "/site/admin-reports.png",
    alt: "Reports after close",
    note: "Heat maps, attention alerts, and saved reports after the last table.",
  },
  {
    id: "settings",
    label: "Settings",
    src: "/site/admin-settings.png",
    alt: "Admin settings for the restaurant",
    note: "Payments, devices, roles, and connectors — off until an address is stored.",
  },
] as const;

/** Shopify-style “see it in action” tabs, using the real product captures. */
export function HomeProductTabs() {
  const [active, setActive] = useState<(typeof views)[number]["id"]>("dashboard");
  const current = views.find((view) => view.id === active) ?? views[0];

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20" aria-labelledby="home-tabs-title">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-primary">Product</p>
        <h2
          id="home-tabs-title"
          className="mt-3 text-3xl font-medium tracking-tight text-balance sm:text-4xl"
        >
          See the floor without a demo call.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Screens from a live OrderlyPOS install — every major admin module.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Product screens"
        className="mt-8 flex gap-1 overflow-x-auto border-b border-border pb-px"
      >
        {views.map((view) => {
          const selected = view.id === active;
          return (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`home-tab-${view.id}`}
              aria-controls="home-tab-panel"
              onClick={() => setActive(view.id)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                selected
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {view.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="home-tab-panel"
        aria-labelledby={`home-tab-${current.id}`}
        className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12"
      >
        <div>
          <h3 className="text-xl font-medium tracking-tight">{current.label}</h3>
          <p className="mt-3 max-w-prose text-base leading-relaxed text-muted-foreground">
            {current.note}
          </p>
          <Link
            href="/orderlyPOS/features"
            className="mt-6 inline-flex text-sm font-medium underline-offset-4 hover:underline"
          >
            Tour every screen
          </Link>
        </div>
        <ProductFrame key={current.id} src={current.src} alt={current.alt} crop />
      </div>
    </section>
  );
}
