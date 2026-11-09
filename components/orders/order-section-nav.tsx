"use client";

import { ModuleSectionNav } from "@/components/layout/module-section-nav";

const LINKS = [
  { href: "/orders", label: "Board", exact: true, description: "Live order board" },
  { href: "/orders/repeat", label: "Repeat", description: "Reorder helpers" },
  { href: "/orders/transfer", label: "Transfer lines", description: "Move items between tickets" },
  { href: "/orders/sessions", label: "Table sessions", description: "Open table checks" },
  { href: "/orders/whatsapp", label: "WhatsApp", description: "Chat orders" },
  { href: "/orders/curbside", label: "Curbside", description: "Pickup staging" },
  { href: "/orders/conflicts", label: "Conflicts", description: "Sync conflicts" },
];

export function OrderSectionNav() {
  return <ModuleSectionNav title="Orders" items={LINKS} />;
}
