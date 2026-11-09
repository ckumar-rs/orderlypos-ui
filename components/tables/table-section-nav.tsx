"use client";

import { ModuleSectionNav } from "@/components/layout/module-section-nav";

const LINKS = [
  { href: "/tables", label: "Floor plan", exact: true, description: "Live table status" },
  { href: "/tables/areas", label: "Areas", description: "Indoor and outdoor" },
  { href: "/tables/split", label: "Split", description: "Split a table" },
  { href: "/tables/move", label: "Move", description: "Move a party" },
  { href: "/tables/history", label: "History", description: "Table history" },
];

export function TableSectionNav() {
  return <ModuleSectionNav title="Tables" items={LINKS} />;
}
