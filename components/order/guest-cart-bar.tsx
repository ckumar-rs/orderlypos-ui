"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/format";
import type { CartLine } from "@/components/order/guest-types";

export function GuestCartBar({
  lines,
  placing,
  placeLabel,
  placingLabel,
  itemsLabel,
  error,
  onPlace,
  onChangeQty,
}: {
  lines: CartLine[];
  placing: boolean;
  placeLabel: string;
  placingLabel: string;
  itemsLabel: string;
  error?: string | null;
  onPlace: () => void;
  onChangeQty: (key: string, delta: number) => void;
}) {
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto max-w-lg overflow-hidden rounded-2xl bg-foreground text-background shadow-[0_16px_48px_-16px_rgba(0,0,0,0.5)]">
        <Sheet>
          <div className="flex items-center gap-2 p-2 pl-3">
            <SheetTrigger className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1.5 text-left outline-none">
              <span className="relative flex size-10 items-center justify-center rounded-xl bg-background/15">
                <ShoppingBag className="size-4" />
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{itemsLabel}</span>
                <span className="block text-xs text-background/70 tabular-nums">
                  {formatCurrency(total)}
                </span>
              </span>
            </SheetTrigger>
            <Button
              type="button"
              className="h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              disabled={placing}
              onClick={onPlace}
            >
              {placing ? placingLabel : placeLabel}
            </Button>
          </div>
          {error ? (
            <p className="border-t border-background/10 px-4 py-2 text-center text-xs text-red-200">
              {error}
            </p>
          ) : null}

          <SheetContent side="bottom" className="max-h-[78dvh] gap-0 rounded-t-3xl px-5 pt-4">
            <SheetHeader className="px-0 text-left">
              <SheetTitle>Your cart</SheetTitle>
            </SheetHeader>
            <ul className="mt-2 flex flex-col divide-y divide-border overflow-y-auto">
              {lines.map((line) => (
                <li key={line.key} className="flex items-center justify-between gap-3 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{line.label}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatCurrency(line.unitPrice)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8 rounded-full"
                      onClick={() => onChangeQty(line.key, -1)}
                    >
                      −
                    </Button>
                    <span className="w-5 text-center text-sm font-semibold tabular-nums">
                      {line.quantity}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8 rounded-full"
                      onClick={() => onChangeQty(line.key, 1)}
                    >
                      +
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex items-center justify-between border-t border-border pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold tabular-nums">{formatCurrency(total)}</p>
              </div>
              <Button
                type="button"
                className="h-11 rounded-xl px-5"
                disabled={placing}
                onClick={onPlace}
              >
                {placing ? placingLabel : placeLabel}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
