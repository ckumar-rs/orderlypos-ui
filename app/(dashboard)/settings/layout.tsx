"use client";

import { ModulePageShell } from "@/components/layout/module-page-shell";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModulePageShell
      title="Settings"
      description="Restaurant, branch, staff, and integrations"
      nav={<SettingsTabs />}
    >
      {children}
    </ModulePageShell>
  );
}
