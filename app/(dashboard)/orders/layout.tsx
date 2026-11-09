"use client";

import { ModulePageShell } from "@/components/layout/module-page-shell";
import { OrderSectionNav } from "@/components/orders/order-section-nav";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModulePageShell
      title="Orders"
      description="Live board, transfers, WhatsApp, and more"
      nav={<OrderSectionNav />}
    >
      {children}
    </ModulePageShell>
  );
}
