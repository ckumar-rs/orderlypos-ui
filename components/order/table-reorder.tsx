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
  onAdd: (dish: {
    menuItemId: string;
    name: string;
    unitPrice: number;
    modifierIds: string[];
    quantity: number;
  }) => void;
}) {
  const [phone, setPhone] = useState("");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Order again</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Look up a past visit with your mobile number.</p>
      </div>
      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          setLoading(true);
          void api
            .get<{ customerName: string | null; dishes: Dish[]; suggestions: Suggestion[] }>(
              `/public/menu/${qrToken}/reorder?phone=${encodeURIComponent(phone)}`,
            )
            .then((row) => {
              setName(row.customerName);
              setDishes(row.dishes);
              setSuggestions(row.suggestions);
            })
            .finally(() => setLoading(false));
        }}
      >
        <Input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Mobile number"
          inputMode="tel"
          className="h-11 rounded-xl border-border/80 bg-card pr-20 shadow-none"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!phone.trim() || loading}
          className="absolute top-1/2 right-1.5 h-8 -translate-y-1/2 rounded-lg px-3"
        >
          {loading ? "…" : "Find"}
        </Button>
      </form>
      {name ? <p className="text-sm text-muted-foreground">Welcome back, {name}</p> : null}
      {dishes.map((dish) => (
        <div key={`${dish.menuItemId}-${dish.name}`} className="flex items-center justify-between gap-2 text-sm">
          <span>
            {dish.quantity}× {dish.name}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => onAdd({ ...dish, quantity: dish.quantity })}
          >
            Add
          </Button>
        </div>
      ))}
      {suggestions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            You might also like
          </p>
          {suggestions.map((dish) => (
            <div key={dish.menuItemId} className="flex items-center justify-between gap-2 text-sm">
              <span>{dish.name}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() =>
                  onAdd({
                    menuItemId: dish.menuItemId,
                    name: dish.name,
                    unitPrice: 0,
                    modifierIds: [],
                    quantity: 1,
                  })
                }
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
