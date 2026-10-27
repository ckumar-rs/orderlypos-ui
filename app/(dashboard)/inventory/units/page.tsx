"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";

const UNITS = ["KG", "G", "L", "ML", "PIECE", "DOZEN", "PACK", "BOX"];

interface UnitRow {
  id?: string;
  fromUnit: string;
  toUnit: string;
  factor: number;
}

export default function UnitsPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const units = useQuery({
    queryKey: ["unit-conversions", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<{ builtin: UnitRow[]; custom: UnitRow[] }>(`/inventory/units?branchId=${branchId}`),
  });
  const [fromUnit, setFromUnit] = useState("PACK");
  const [toUnit, setToUnit] = useState("PIECE");
  const [factor, setFactor] = useState("6");

  return (
    <div className="flex flex-col gap-4">
      <InventoryTabs />
      <div>
        <h1 className="text-2xl font-semibold">Units</h1>
        <p className="text-sm text-muted-foreground">
          Kilogram, litre, and dozen conversions apply to every ingredient. Add a pack or box size for this branch. One from-unit equals the factor in the to-unit.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Factor</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(units.data?.builtin ?? []).map((row) => (
            <TableRow key={`${row.fromUnit}-${row.toUnit}`}>
              <TableCell>1 {row.fromUnit}</TableCell>
              <TableCell>{row.toUnit}</TableCell>
              <TableCell>{row.factor}</TableCell>
              <TableCell>Built in</TableCell>
            </TableRow>
          ))}
          {(units.data?.custom ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>1 {row.fromUnit}</TableCell>
              <TableCell>{row.toUnit}</TableCell>
              <TableCell>{row.factor}</TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    api
                      .delete(`/inventory/units/${row.id}?branchId=${branchId}`)
                      .then(() => qc.invalidateQueries({ queryKey: ["unit-conversions", branchId] }))
                      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not remove it"))
                  }
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          api
            .post(`/inventory/units?branchId=${branchId}`, { fromUnit, toUnit, factor: Number(factor) })
            .then(() => {
              toast.success("Conversion saved");
              qc.invalidateQueries({ queryKey: ["unit-conversions", branchId] });
            })
            .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save the conversion"));
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          From
          <select className="h-10 rounded-md border border-border bg-background px-2" value={fromUnit} onChange={(event) => setFromUnit(event.target.value)}>
            {UNITS.map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          To
          <select className="h-10 rounded-md border border-border bg-background px-2" value={toUnit} onChange={(event) => setToUnit(event.target.value)}>
            {UNITS.map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Factor
          <Input value={factor} onChange={(event) => setFactor(event.target.value)} inputMode="decimal" className="w-28" />
        </label>
        <Button type="submit">Save conversion</Button>
      </form>
    </div>
  );
}
