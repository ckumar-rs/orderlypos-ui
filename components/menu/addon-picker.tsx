"use client";

import { Label } from "@/components/ui/label";
import { useModifierGroups } from "@/hooks/use-menu";

export function AddonPicker({
  branchId,
  selectedIds,
  onChange,
}: {
  branchId: string | null;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const { data: groups } = useModifierGroups(branchId);
  if (!groups?.length) return null;

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((row) => row !== id) : [...selectedIds, id]);
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <Label>Add-ons on the kiosk</Label>
      <p className="text-xs text-muted-foreground">
        A guest who taps this dish will pick these extras before it goes in the cart.
      </p>
      <div className="flex flex-col gap-1.5">
        {groups.map((group) => (
          <label key={group.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedIds.includes(group.id)}
              onChange={() => toggle(group.id)}
            />
            <span>
              {group.name}
              <span className="text-muted-foreground">
                {" "}
                · {group.modifiers.map((row) => row.name).join(", ") || "empty"}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
