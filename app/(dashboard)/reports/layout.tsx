"use client";

import { ModulePageShell } from "@/components/layout/module-page-shell";
import { ReportSectionNav } from "@/components/reports/report-section-nav";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModulePageShell
      title="Reports"
      description="Sales, floor, saved views, and schedules"
      nav={<ReportSectionNav />}
    >
      {children}
    </ModulePageShell>
  );
}
