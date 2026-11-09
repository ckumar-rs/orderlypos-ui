"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useOnboarding,
  usePatchOnboarding,
  type OnboardingConfig,
} from "@/hooks/use-settings";
import { ApiError } from "@/lib/api";

export function OnboardingCard({ branchId }: { branchId: string | null }) {
  const router = useRouter();
  const { data, isLoading } = useOnboarding(branchId);
  const patch = usePatchOnboarding(branchId);
  const [config, setConfig] = useState<OnboardingConfig | null>(null);

  useEffect(() => {
    if (data?.config) setConfig(data.config);
  }, [data?.config]);

  if (isLoading || !data || !config) return null;

  const checklist = [
    { key: "business", label: config.labelBusiness || "Business", ok: data.checks.business },
    { key: "branch", label: config.labelBranch || "Branch", ok: data.checks.branch },
    { key: "floor", label: config.labelFloor || "Floor", ok: data.checks.floor },
    { key: "menu", label: config.labelMenu || "Menu", ok: data.checks.menu },
    { key: "guests", label: config.labelGuests || "Guests", ok: data.checks.guests },
  ] as const;

  const setField = <K extends keyof OnboardingConfig>(key: K, value: OnboardingConfig[K]) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const saveConfig = () => {
    patch.mutate(
      { action: "set_config", config },
      {
        onSuccess: () => toast.success("Setup wizard settings saved"),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not save"),
      },
    );
  };

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[18px] font-medium text-foreground">Setup wizard</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Labels and empty prefill fields are stored in restaurant settings. Leave floor/menu
            prefills blank so owners enter their own data — no demo catalog.
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2 sm:mt-0">
          <span className="text-xs text-muted-foreground">Require wizard</span>
          <Switch
            checked={data.enabled}
            onCheckedChange={(enabled) => {
              patch.mutate(
                { action: "set_enabled", enabled },
                {
                  onError: (err) =>
                    toast.error(err instanceof ApiError ? err.message : "Could not update"),
                },
              );
            }}
          />
        </div>
      </div>

      <ul className="divide-y divide-border border-y border-border">
        {checklist.map((item) => (
          <li key={item.key} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-foreground">{item.label}</span>
            <span className={item.ok ? "text-success" : "text-muted-foreground"}>
              {item.ok ? "Done" : "Open"}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        Status:{" "}
        {data.completed
          ? data.skipped
            ? "Skipped"
            : "Completed"
          : data.enabled
            ? `In progress (${data.step})`
            : "Not required"}
        {" · "}
        {data.counts.tables} tables · {data.counts.menuItems} dishes
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ob-cfg-floor">Default floor name</Label>
          <Input
            id="ob-cfg-floor"
            value={config.defaultFloorName}
            onChange={(e) => setField("defaultFloorName", e.target.value)}
            placeholder="Leave blank"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ob-cfg-tables">Default table count</Label>
          <Input
            id="ob-cfg-tables"
            value={config.defaultTableCount}
            onChange={(e) => setField("defaultTableCount", e.target.value)}
            placeholder="Leave blank"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ob-cfg-cap">Default seats / table</Label>
          <Input
            id="ob-cfg-cap"
            value={config.defaultTableCapacity}
            onChange={(e) => setField("defaultTableCapacity", e.target.value)}
            placeholder="Leave blank"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ob-cfg-cat">Default category</Label>
          <Input
            id="ob-cfg-cat"
            value={config.defaultCategoryName}
            onChange={(e) => setField("defaultCategoryName", e.target.value)}
            placeholder="Leave blank"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ob-cfg-dish">Default dish</Label>
          <Input
            id="ob-cfg-dish"
            value={config.defaultDishName}
            onChange={(e) => setField("defaultDishName", e.target.value)}
            placeholder="Leave blank"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ob-cfg-price">Default dish price</Label>
          <Input
            id="ob-cfg-price"
            value={config.defaultDishPrice}
            onChange={(e) => setField("defaultDishPrice", e.target.value)}
            placeholder="Leave blank"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ob-cfg-tax">Default dish tax %</Label>
          <Input
            id="ob-cfg-tax"
            value={config.defaultDishTaxPercent}
            onChange={(e) => setField("defaultDishTaxPercent", e.target.value)}
            placeholder="Leave blank"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={patch.isPending} onClick={saveConfig}>
          Save wizard settings
        </Button>
        {data.completed ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={patch.isPending}
            onClick={() =>
              patch.mutate(
                { action: "reopen", step: "business" },
                {
                  onSuccess: () => {
                    toast.success("Setup reopened");
                    router.push("/onboarding");
                  },
                  onError: (err) =>
                    toast.error(err instanceof ApiError ? err.message : "Could not reopen"),
                },
              )
            }
          >
            Open setup again
          </Button>
        ) : (
          <Button render={<Link href="/onboarding" />} size="sm" variant="secondary">
            Continue setup
          </Button>
        )}
        {data.completed ? null : (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={patch.isPending}
            onClick={() =>
              patch.mutate(
                { action: "skip" },
                {
                  onSuccess: () => toast.success("Setup skipped"),
                  onError: (err) =>
                    toast.error(err instanceof ApiError ? err.message : "Could not skip"),
                },
              )
            }
          >
            Mark complete / skip
          </Button>
        )}
      </div>
    </Card>
  );
}
