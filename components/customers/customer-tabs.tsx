"use client";

import { ModuleSectionNav } from "@/components/layout/module-section-nav";

const TABS = [
  { label: "Customers", href: "/customers", exact: true, description: "Guest list and follow-ups" },
  { label: "Analytics", href: "/customers/analytics", description: "RFM and visit insights" },
  { label: "Loyalty rules", href: "/customers/loyalty", description: "Points and tiers" },
  { label: "Rewards", href: "/customers/rewards", description: "Redeemable rewards" },
  { label: "Gift cards", href: "/customers/gift-cards", description: "Issue and list gift cards" },
  { label: "Staff discounts", href: "/customers/staff-discounts", description: "Employee discount rules" },
];

export function CustomerTabs() {
  return <ModuleSectionNav title="Customers" items={TABS} />;
}
