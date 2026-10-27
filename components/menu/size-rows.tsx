"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SizeDraft {
  name: string;
  price: string;
}

export function SizeRows({
  sizes,
  onChange,
}: {
  sizes: SizeDraft[];
  onChange: (next: SizeDraft[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Sizes</Label>
      <p className="text-xs text-muted-foreground">
        Named portions for this dish. Leave empty to sell at the item price only.
      </p>
      {sizes.map((size, index) => (
        <div key={index} className="grid grid-cols-[1fr_7rem_auto] gap-2">
          <Input
            value={size.name}
            onChange={(e) =>
              onChange(sizes.map((row, i) => (i === index ? { ...row, name: e.target.value } : row)))
            }
            placeholder="Size name"
            aria-label={`Size ${index + 1} name`}
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            value={size.price}
            onChange={(e) =>
              onChange(sizes.map((row, i) => (i === index ? { ...row, price: e.target.value } : row)))
            }
            placeholder="Price"
            aria-label={`Size ${index + 1} price`}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange(sizes.filter((_, i) => i !== index))}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => onChange([...sizes, { name: "", price: "" }])}>
        Add size
      </Button>
    </div>
  );
}

export function packedSizes(sizes: SizeDraft[]) {
  return sizes
    .filter((row) => row.name.trim())
    .map((row, index) => ({
      name: row.name.trim(),
      price: Number(row.price) || 0,
      sortOrder: index,
    }));
}
