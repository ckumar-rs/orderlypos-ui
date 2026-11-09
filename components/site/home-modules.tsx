"use client";

import Link from "next/link";
import { ProductFrame } from "@/components/site/product-frame";
import { SiteReveal, SiteRevealGroup, SiteRevealItem } from "@/components/site/site-motion";

/** Key modules with real admin captures — every primary surface. */
const modules = [
  {
    title: "Dashboard",
    body: "Revenue, open tables, kitchen queue, and today’s channels on one screen.",
    src: "/site/admin-dashboard.png",
    href: "/orderlyPOS/features",
  },
  {
    title: "Till",
    body: "Live floor with open bills on each table. Pass, Floor, Menu, and Sales under the thumb.",
    src: "/site/admin-pos.png",
    href: "/orderlyPOS/features",
  },
  {
    title: "Kitchen",
    body: "Stations, expo, timers, and a late ticket marked on the pass.",
    src: "/site/admin-kds.png",
    href: "/orderlyPOS/features",
  },
  {
    title: "Floor",
    body: "Tables, moves, areas, and reservations on the live plan.",
    src: "/site/admin-tables.png",
    href: "/orderlyPOS/features",
  },
  {
    title: "Menu",
    body: "Dishes, add-ons, seasons, and prices for till, QR, kiosk, and WhatsApp.",
    src: "/site/admin-menu.png",
    href: "/orderlyPOS/features",
  },
  {
    title: "Inventory",
    body: "Stock, recipes, waste, purchase orders, and food cost.",
    src: "/site/admin-inventory.png",
    href: "/orderlyPOS/features",
  },
  {
    title: "Delivery",
    body: "Live map, zones, drivers, and a trail while the order is out.",
    src: "/site/admin-delivery.png",
    href: "/orderlyPOS/features",
  },
  {
    title: "Marketing",
    body: "Coupons, happy hour, campaigns, and buy-and-get rules.",
    src: "/site/admin-marketing.png",
    href: "/orderlyPOS/features",
  },
  {
    title: "Accounting",
    body: "Drawer, expenses, P&L, GST, and journals on the restaurant host.",
    src: "/site/admin-accounting.png",
    href: "/orderlyPOS/features",
  },
  {
    title: "Ask",
    body: "Reads sales, tickets, stock, and today’s book. Does not take a payment.",
    src: "/site/admin-agent.png",
    href: "/orderlyPOS/agent",
  },
  {
    title: "Reports",
    body: "Heat maps, floor attention, saved reports, and franchise views.",
    src: "/site/admin-reports.png",
    href: "/orderlyPOS/features",
  },
  {
    title: "Settings",
    body: "Payments, devices, roles, automation, and every connector — off until stored.",
    src: "/site/admin-settings.png",
    href: "/orderlyPOS/features",
  },
];

export function HomeModules() {
  return (
    <section className="border-y border-border" aria-labelledby="home-modules-title" id="modules">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <SiteReveal>
          <p className="text-sm font-medium text-primary">Modules</p>
          <h2
            id="home-modules-title"
            className="mt-3 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-4xl"
          >
            Every screen the admin app opens.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Captures from a live OrderlyPOS install — floor and back office.
          </p>
        </SiteReveal>
        <SiteRevealGroup className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <SiteRevealItem key={mod.title} className="flex flex-col gap-4">
              <ProductFrame src={mod.src} alt={mod.title} crop />
              <div>
                <h3 className="text-lg font-medium">{mod.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mod.body}</p>
                <Link
                  href={mod.href}
                  className="mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
                >
                  Open {mod.title}
                </Link>
              </div>
            </SiteRevealItem>
          ))}
        </SiteRevealGroup>
        <p className="mt-10 text-sm text-muted-foreground">
          Also in the signed-in app: Orders, Reservations, Approvals, Customers, Team, GST billing,
          Franchise, Operations, and Attendance.{" "}
          <Link href="/orderlyPOS/features" className="font-medium text-foreground underline-offset-4 hover:underline">
            Full feature list
          </Link>
        </p>
      </div>
    </section>
  );
}
