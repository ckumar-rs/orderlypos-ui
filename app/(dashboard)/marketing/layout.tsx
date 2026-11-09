"use client";

import { ModulePageShell } from "@/components/layout/module-page-shell";
import { PromoNav } from "@/components/marketing/promo-nav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModulePageShell
      title="Marketing"
      description="Coupons, promotions, and campaigns"
      nav={<PromoNav />}
    >
      {children}
    </ModulePageShell>
  );
}
