"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError, api } from "@/lib/api";

export default function CurrenciesPage() {
  const qc = useQueryClient();
  const rates = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => api.get<Array<{ id: string; currency: string; rateToBase: string | number }>>("/service/rates"),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("");
  const [rate, setRate] = useState("");

  const reset = () => {
    setEditingId(null);
    setCurrency("");
    setRate("");
  };

  const submit = () => {
    api
      .post("/service/rates", { currency, rateToBase: Number(rate) })
      .then(() => {
        toast.success(editingId ? "Rate updated" : "Rate saved");
        reset();
        qc.invalidateQueries({ queryKey: ["exchange-rates"] });
      })
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save"));
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Currencies</h1>
        <p className="text-sm text-muted-foreground">Store how many units of a currency equal one unit of the restaurant currency. Checkout still settles in the restaurant currency.</p>
      </div>
      <Card className="grid gap-2 p-4 md:grid-cols-[8rem_1fr_auto_auto]">
        <Input
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          placeholder="USD"
          maxLength={3}
          disabled={Boolean(editingId)}
        />
        <Input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Rate to base" inputMode="decimal" />
        <Button type="button" onClick={submit}>
          {editingId ? "Save" : "Create"}
        </Button>
        {editingId && (
          <Button type="button" variant="outline" onClick={reset}>
            Cancel
          </Button>
        )}
      </Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Units per base</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(rates.data ?? []).map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.currency}</TableCell>
              <TableCell>{String(row.rateToBase)}</TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setEditingId(row.id);
                    setCurrency(row.currency);
                    setRate(String(row.rateToBase));
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  className="ml-2"
                  onClick={() => {
                    if (!confirm(`Remove ${row.currency}?`)) return;
                    api
                      .delete(`/service/rates/${row.id}`)
                      .then(() => {
                        if (editingId === row.id) reset();
                        toast.success("Rate removed");
                        qc.invalidateQueries({ queryKey: ["exchange-rates"] });
                      })
                      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not remove"));
                  }}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
