"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/hooks/use-branch";
import { useMenuItems, useUpdateMenuItem } from "@/hooks/use-menu";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export default function SkuPage() {
  const { branchId } = useBranch();
  const items = useMenuItems(branchId);
  const update = useUpdateMenuItem(branchId);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [sku, setSku] = useState("");
  const needle = query.trim().toLowerCase();
  const rows = useMemo(() => {
    const list = items.data ?? [];
    if (!needle) return list;
    return list.filter((item) => item.name.toLowerCase().includes(needle) || (item.sku ?? "").toLowerCase().includes(needle));
  }, [items.data, needle]);
  const selected = (items.data ?? []).find((item) => item.id === selectedId);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/menu" className="text-sm text-muted-foreground">Back to the menu</Link>
      <div>
        <h1 className="text-2xl font-semibold">SKU</h1>
        <p className="text-sm text-muted-foreground">Search dishes by name or SKU, then save a code on the selected dish.</p>
      </div>
      <Card className="grid gap-3 p-4 md:grid-cols-[1fr_220px_auto]">
        <div>
          <p className="mb-1 text-sm">{selected ? selected.name : "Select a dish in the list"}</p>
          <Input aria-label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" />
        </div>
        <p className="self-end text-sm text-muted-foreground">{selected ? formatCurrency(selected.price) : ""}</p>
        <Button
          type="button"
          className="self-end"
          disabled={!selected || update.isPending}
          onClick={() => {
            if (!selected) return;
            const next = sku.trim();
            const clash = (items.data ?? []).find((item) => item.id !== selected.id && (item.sku ?? "").toLowerCase() === next.toLowerCase() && next);
            if (clash) {
              toast.error(`${clash.name} already uses ${next}`);
              return;
            }
            update.mutate(
              { id: selected.id, dto: { sku: next || null } },
              {
                onSuccess: () => toast.success(next ? `SKU ${next} saved` : "SKU cleared"),
                onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not save the SKU"),
              },
            );
          }}
        >
          Save SKU
        </Button>
      </Card>
      <Input aria-label="Search SKU" placeholder="Search name or SKU" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Dish</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr
                key={item.id}
                className={item.id === selectedId ? "border-t border-border bg-secondary" : "border-t border-border"}
              >
                <td className="px-3 py-2 font-mono">{item.sku || "—"}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-left underline"
                    onClick={() => {
                      setSelectedId(item.id);
                      setSku(item.sku ?? "");
                    }}
                  >
                    {item.name}
                  </button>
                </td>
                <td className="px-3 py-2">{item.category.name}</td>
                <td className="px-3 py-2">{formatCurrency(item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
