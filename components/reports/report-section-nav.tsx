"use client";

import { ModuleSectionNav } from "@/components/layout/module-section-nav";

const LINKS = [
  { href: "/reports", label: "Overview", exact: true, description: "Heat map and catalog" },
  { href: "/reports/floor", label: "Floor", description: "Floor performance" },
  { href: "/reports/attention", label: "Attention", description: "Alerts and outliers" },
  { href: "/reports/saved", label: "Saved", description: "Saved reports" },
  { href: "/reports/bi", label: "Business", description: "Business intelligence" },
  { href: "/franchise", label: "Franchise", description: "Multi-location" },
];

export function ReportSectionNav() {
  return <ModuleSectionNav title="Reports" items={LINKS} />;
}
