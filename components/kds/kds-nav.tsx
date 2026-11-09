"use client";

import { ModuleSectionNav } from "@/components/layout/module-section-nav";

const LINKS = [
  { href: "/kds", label: "Status board", exact: true, description: "Ticket columns" },
  { href: "/kds/stations", label: "Stations", description: "By kitchen station" },
  { href: "/kds/expo", label: "Expo", description: "Pass / expo board" },
  { href: "/kds/performance", label: "Station report", description: "Prep times" },
];

export function KdsNav() {
  return <ModuleSectionNav title="Kitchen" items={LINKS} />;
}
