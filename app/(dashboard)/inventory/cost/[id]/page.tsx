"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { useBranch } from "@/hooks/use-branch";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export default function RecipeHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { branchId } = useBranch();
  const history = useQuery({
    queryKey: ["recipe-history", branchId, id],
    enabled: Boolean(branchId),
    queryFn: () =>
      api.get<
        Array<{
          id: string;
          createdAt: string;
          foodCost: string | number;
          sellingPrice: string | number;
          note: string | null;
          servings?: number;
          instructions?: string | null;
          lines?: Array<{ name: string; quantity: number; unit: string; stockQuantity: number; stockUnit: string }>;
        }>
      >(`/service/food-cost/${id}/history?branchId=${branchId}`),
  });
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <InventoryTabs />
      <Link href="/inventory/cost" className="text-sm text-muted-foreground">Back to food cost</Link>
      <h1 className="text-2xl font-semibold">Price history</h1>
      <ol className="flex flex-col gap-3 border-l border-border pl-4">
        {(history.data ?? []).map((row) => (
          <li key={row.id}>
            <p className="text-sm text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</p>
            <p>Sold at {formatCurrency(Number(row.sellingPrice))} · {formatCurrency(Number(row.foodCost))} per serving{row.servings ? ` · ${row.servings} servings` : ""}</p>
            {row.note ? <p className="text-sm">{row.note}</p> : null}
            {Array.isArray(row.lines) && row.lines.length > 0 && (
              <ul className="mt-1 text-sm text-muted-foreground">
                {row.lines.map((line) => (
                  <li key={`${row.id}-${line.name}`}>
                    {line.quantity} {line.unit} {line.name}
                    {line.stockUnit !== line.unit ? ` (${line.stockQuantity} ${line.stockUnit})` : ""}
                  </li>
                ))}
              </ul>
            )}
            {row.instructions ? <p className="text-sm">{row.instructions}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
