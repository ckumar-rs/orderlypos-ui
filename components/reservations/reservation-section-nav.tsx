"use client";

import { ModuleSectionNav } from "@/components/layout/module-section-nav";

const LINKS = [
  { href: "/reservations", label: "Bookings", exact: true, description: "Upcoming reservations" },
  { href: "/reservations/follow-up", label: "Follow-up", description: "Texts and no-shows" },
  { href: "/reservations/forecast", label: "Forecast", description: "Cover projections" },
  { href: "/reservations/deposits", label: "Deposits", description: "Deposit tracking" },
];

export function ReservationSectionNav() {
  return <ModuleSectionNav title="Reservations" items={LINKS} />;
}
