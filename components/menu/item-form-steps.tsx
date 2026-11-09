"use client";

import { cn } from "@/lib/utils";

export const ITEM_FORM_STEPS = [
  { id: "basics", label: "Basics" },
  { id: "pricing", label: "Pricing" },
  { id: "kitchen", label: "Kitchen" },
  { id: "details", label: "Details" },
] as const;

export function ItemFormStepChrome({
  step,
  onJumpBack,
  title,
}: {
  step: number;
  onJumpBack: (index: number) => void;
  title: string;
}) {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        Step {step + 1} of {ITEM_FORM_STEPS.length}: {ITEM_FORM_STEPS[step].label}
        {title ? ` — ${title}` : null}
      </p>
      <div className="flex gap-1.5" aria-hidden>
        {ITEM_FORM_STEPS.map((row, index) => (
          <div
            key={row.id}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              index <= step ? "bg-primary" : "bg-secondary",
            )}
          />
        ))}
      </div>
      <nav className="flex flex-wrap gap-1.5" aria-label="Form steps">
        {ITEM_FORM_STEPS.map((row, index) => (
          <button
            key={row.id}
            type="button"
            disabled={index > step}
            onClick={() => {
              if (index < step) onJumpBack(index);
            }}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-default",
              index === step
                ? "bg-primary text-primary-foreground"
                : index < step
                  ? "bg-accent text-accent-foreground hover:bg-accent/80"
                  : "bg-secondary text-muted-foreground",
            )}
          >
            {index + 1}. {row.label}
          </button>
        ))}
      </nav>
    </>
  );
}
