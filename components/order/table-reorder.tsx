"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface Dish {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifierIds: string[];
}

interface Suggestion {
  menuItemId: string;
  name: string;
}

export function TableReorder({
  qrToken,
  onAdd,
}: {
  qrToken: string;
  onAdd: (dish: { menuItemId: string; name: string; unitPrice: number; modifierIds: string[]; quantity: number }) => void;
}) {
  const [phone, setPhone] = useState("");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [name, setName] = useState<string | null>(null);
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border p-4">
      <h2 className="text-sm font-medium">Order again</h2>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void api
            .get<{ customerName: string | null; dishes: Dish[]; suggestions: Suggestion[] }>(
              `/public/menu/${qrToken}/reorder?phone=${encodeURIComponent(phone)}`,
            )
            .then((row) => {
              setName(row.customerName);
              setDishes(row.dishes);
              setSuggestions(row.suggestions);
            });
        }}
      >
        <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Mobile number" inputMode="tel" />
        <Button type="submit">Find</Button>
      </form>
      {name ? <p className="text-sm text-muted-foreground">Welcome back, {name}</p> : null}
      {dishes.map((dish) => (
        <div key={`${dish.menuItemId}-${dish.name}`} className="flex items-center justify-between gap-2 text-sm">
          <span>{dish.quantity}× {dish.name}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => onAdd({ ...dish, quantity: dish.quantity })}>Add</Button>
        </div>
      ))}
      {suggestions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">You might also like</p>
          {suggestions.map((dish) => (
            <div key={dish.menuItemId} className="flex items-center justify-between gap-2 text-sm">
              <span>{dish.name}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAdd({ menuItemId: dish.menuItemId, name: dish.name, unitPrice: 0, modifierIds: [], quantity: 1 })}
              >
                Add
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
