"use client";

import { ModulePageShell } from "@/components/layout/module-page-shell";
import { KdsNav } from "@/components/kds/kds-nav";

export default function KdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModulePageShell
      title="Kitchen display"
      description="Tickets, stations, expo, and prep times"
      nav={<KdsNav />}
    >
      {children}
    </ModulePageShell>
  );
}
