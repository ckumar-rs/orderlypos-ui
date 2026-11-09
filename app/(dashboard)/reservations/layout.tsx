"use client";

import { ModulePageShell } from "@/components/layout/module-page-shell";
import { ReservationSectionNav } from "@/components/reservations/reservation-section-nav";

export default function ReservationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModulePageShell
      title="Reservations"
      description="Bookings, follow-ups, forecast, and deposits"
      nav={<ReservationSectionNav />}
    >
      {children}
    </ModulePageShell>
  );
}
