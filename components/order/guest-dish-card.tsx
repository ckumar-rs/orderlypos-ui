"use client";

import { Leaf, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PublicMenuItem } from "@/components/order/guest-types";

export function GuestDishCard({
  item,
  quantity,
  addLabel,
  onAdd,
  onRemove,
}: {
  item: PublicMenuItem;
  quantity: number;
  addLabel: string;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <article
      className="group flex items-start gap-3 pt-4 pb-8"
    >
      <div className="min-w-0 flex-1 pr-1">
        <div className="flex items-start gap-2">
          <span
            className={cn(
              "mt-1.5 size-2.5 shrink-0 rounded-[2px] border",
              item.isVeg ? "border-success bg-success" : "border-destructive bg-destructive",
            )}
            title={item.isVeg ? "Vegetarian" : "Non-vegetarian"}
          />
          <div className="min-w-0">
            <h3 className="text-[15px] leading-snug font-semibold text-foreground">{item.name}</h3>
            {item.description ? (
              <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
                {item.description}
              </p>
            ) : null}
            <p className="mt-2.5 text-sm font-semibold tabular-nums tracking-tight text-foreground">
              {formatCurrency(item.price)}
            </p>
          </div>
        </div>
      </div>

      <div className="relative w-28 shrink-0 grow-0 basis-28">
        <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- public menu photo URL
            <img
              src={item.imageUrl}
              alt=""
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Leaf
                className={cn("size-5", item.isVeg ? "text-success" : "text-destructive")}
                aria-hidden
              />
            </div>
          )}
        </div>
        <div className="absolute -bottom-3 left-1/2 z-10 -translate-x-1/2">
          {quantity > 0 ? (
            <div className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5 shadow-md">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                aria-label="Remove one"
                onClick={onRemove}
              >
                <Minus className="size-3.5" />
              </Button>
              <span className="w-6 text-center text-sm font-semibold tabular-nums">{quantity}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-primary"
                aria-label="Add one"
                onClick={onAdd}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-primary/40 bg-card px-4 font-semibold text-primary shadow-md hover:bg-primary hover:text-primary-foreground"
              onClick={onAdd}
            >
              {addLabel}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
