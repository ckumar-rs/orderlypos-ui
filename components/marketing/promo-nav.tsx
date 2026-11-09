"use client";

import { ModuleSectionNav } from "@/components/layout/module-section-nav";

const LINKS = [
  { href: "/marketing", label: "Coupons & campaigns", exact: true, description: "Codes, happy hour, bulk sends" },
  { href: "/marketing/categories", label: "Category discounts", description: "Discounts by category" },
  { href: "/marketing/quantity", label: "Buy and get", description: "Quantity promos" },
  { href: "/marketing/conditions", label: "Conditions", description: "Promo rules" },
];

export function PromoNav() {
  return <ModuleSectionNav title="Marketing" items={LINKS} />;
}
