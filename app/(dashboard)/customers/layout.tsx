"use client";

import { CustomerTabs } from "@/components/customers/customer-tabs";
import { ModulePageShell } from "@/components/layout/module-page-shell";

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModulePageShell
      title="Customers"
      description="Guests, loyalty, rewards, and follow-ups"
      nav={<CustomerTabs />}
    >
      {children}
    </ModulePageShell>
  );
}
