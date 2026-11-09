"use client";

import { Label } from "@/components/ui/label";

/** Guest-facing allergen vocabulary stored as free strings on MenuItem.allergens. */
export const COMMON_ALLERGENS = [
  "peanuts",
  "tree nuts",
  "dairy",
  "eggs",
  "gluten",
  "soy",
  "shellfish",
  "fish",
  "sesame",
] as const;

export function AllergenFields({
  allergens,
  onChange,
  description,
  onDescriptionChange,
}: {
  allergens: string[];
  onChange: (next: string[]) => void;
  description: string;
  onDescriptionChange: (next: string) => void;
}) {
  const toggle = (tag: string) => {
    onChange(
      allergens.includes(tag)
        ? allergens.filter((a) => a !== tag)
        : [...allergens, tag],
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="item-description">Guest description</Label>
        <textarea
          id="item-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          maxLength={600}
          placeholder="Short dish story for kiosk and QR menus"
          className="min-h-16 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Allergens</Label>
        <p className="text-xs text-muted-foreground">
          Shown to staff and guests. Toggle what this dish contains.
        </p>
        <div className="flex flex-wrap gap-2">
          {COMMON_ALLERGENS.map((tag) => {
            const on = allergens.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                className={
                  on
                    ? "rounded-full border border-primary bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    : "rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary"
                }
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
