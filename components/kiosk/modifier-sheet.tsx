"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { KioskMenuItem } from "@/lib/kiosk-api";
import { cn } from "@/lib/utils";
import { KButton } from "./kiosk-ui";

export interface ModifierChoice {
  modifierIds: string[];
  label: string;
  /** sum of priceAdjustment, for the preview total only */
  extra: number;
  sizeId?: string;
  sizePrice?: number;
}

/** Full-screen-ish option picker. Remounted per item (keyed by the parent). */
export function ModifierSheet({
  item,
  priceText,
  onCancel,
  onConfirm,
}: {
  item: KioskMenuItem;
  priceText: (amount: number) => string;
  onCancel: () => void;
  onConfirm: (choice: ModifierChoice) => void;
}) {
  const { t } = useI18n();
  const groups = item.modifierGroups.map((g) => g.modifierGroup);
  const [selected, setSelected] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      groups
        .map((g) => [g.id, g.modifiers.filter((m) => m.isDefault).map((m) => m.id)] as const)
        .filter(([, ids]) => ids.length > 0),
    ),
  );
  const [problem, setProblem] = useState<string | null>(null);
  const [sizeId, setSizeId] = useState(item.sizes?.[0]?.id ?? "");

  const toggle = (groupId: string, modifierId: string, max: number) => {
    setProblem(null);
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(modifierId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== modifierId) };
      }
      // A single-choice group swaps; a multi-choice group stops at its max.
      if (max === 1) return { ...prev, [groupId]: [modifierId] };
      if (current.length >= max) return prev;
      return { ...prev, [groupId]: [...current, modifierId] };
    });
  };

  const confirm = () => {
    for (const g of groups) {
      const need = Math.max(g.minSelect, g.isRequired ? 1 : 0);
      if ((selected[g.id]?.length ?? 0) < need) {
        setProblem(t("kiosk.modifiers.pickMin", { min: need, group: g.name }));
        return;
      }
    }
    const chosen = groups.flatMap((g) => g.modifiers.filter((m) => selected[g.id]?.includes(m.id)));
    const size = item.sizes?.find((row) => row.id === sizeId);
    onConfirm({
      modifierIds: chosen.map((m) => m.id),
      label: [size?.name, ...chosen.map((m) => m.name)].filter(Boolean).join(", "),
      extra: chosen.reduce((sum, m) => sum + Number(m.priceAdjustment), 0),
      sizeId: size?.id,
      sizePrice: size ? Number(size.price) : undefined,
    });
  };

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-6"
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <div className="flex max-h-full w-full max-w-[44rem] flex-col overflow-hidden rounded-3xl bg-card shadow-2xl">
        <div className="border-b border-border p-6">
          <h2 className="text-[1.75rem] font-bold leading-tight">{item.name}</h2>
          <p className="text-[1.1rem] text-muted-foreground">{t("kiosk.modifiers.choose")}</p>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {(item.sizes?.length ?? 0) > 0 && (
            <fieldset>
              <legend className="mb-3 text-[1.25rem] font-semibold">Size</legend>
              <div className="grid grid-cols-2 gap-3">
                {item.sizes?.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    aria-pressed={sizeId === size.id}
                    onClick={() => setSizeId(size.id)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left text-[1.1rem] font-semibold",
                      sizeId === size.id ? "border-primary bg-accent" : "border-border",
                    )}
                  >
                    <span className="block">{size.name}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {priceText(Number(size.price))}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          {groups.map((g) => {
            const required = g.isRequired || g.minSelect > 0;
            return (
              <fieldset key={g.id}>
                <legend className="mb-3 flex items-baseline gap-3 text-[1.25rem] font-semibold">
                  {g.name}
                  <span className="text-[1rem] font-normal text-muted-foreground">
                    {required
                      ? t("kiosk.modifiers.required")
                      : g.maxSelect > 1
                        ? t("kiosk.modifiers.upTo", { max: g.maxSelect })
                        : ""}
                  </span>
                </legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {g.modifiers.map((m) => {
                    const on = selected[g.id]?.includes(m.id) ?? false;
                    const adj = Number(m.priceAdjustment);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role={g.maxSelect === 1 ? "radio" : "checkbox"}
                        aria-checked={on}
                        onClick={() => toggle(g.id, m.id, g.maxSelect)}
                        className={cn(
                          "flex touch-manipulation select-none flex-col overflow-hidden rounded-2xl border-2 text-left",
                          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
                          on ? "border-primary bg-accent" : "border-border bg-card hover:bg-secondary",
                        )}
                      >
                        <span className="relative block aspect-square w-full bg-secondary">
                          {m.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- uploaded add-on photo
                            <img src={m.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full items-center justify-center text-[2rem] font-bold text-muted-foreground">
                              {m.name.slice(0, 1)}
                            </span>
                          )}
                          <span
                            aria-hidden
                            className={cn(
                              "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2",
                              on ? "border-primary bg-primary text-primary-foreground" : "border-white bg-black/30 text-white",
                            )}
                          >
                            {on && <Check className="h-4 w-4" />}
                          </span>
                        </span>
                        <span className="flex flex-col gap-0.5 p-3">
                          <span className="text-[1.05rem] font-semibold leading-tight">{m.name}</span>
                          {adj !== 0 && (
                            <span className="text-[0.95rem] tabular-nums text-muted-foreground">
                              {adj > 0 ? "+" : ""}
                              {priceText(adj)}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
          {problem && (
            <p role="alert" className="text-[1.1rem] font-semibold text-destructive">
              {problem}
            </p>
          )}
        </div>
        <div className="flex gap-3 border-t border-border p-4">
          <KButton variant="secondary" large onClick={onCancel} className="flex-1">
            {t("kiosk.cancel")}
          </KButton>
          <KButton large onClick={confirm} className="flex-[2]">
            {t("kiosk.modifiers.add")}
          </KButton>
        </div>
      </div>
    </div>
  );
}
