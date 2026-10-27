"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SettingsTabs } from "@/components/settings/settings-tabs";
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
  const [currency, setCurrency] = useState("");
  const [rate, setRate] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <SettingsTabs />
      <div>
        <h1 className="text-lg font-semibold">Currencies</h1>
        <p className="text-sm text-muted-foreground">Store how many units of a currency equal one unit of the restaurant currency. Checkout still settles in the restaurant currency.</p>
      </div>
      <Card className="grid gap-2 p-4 md:grid-cols-[8rem_1fr_auto]">
        <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" maxLength={3} />
        <Input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Rate to base" inputMode="decimal" />
        <Button type="button" onClick={() => api.post("/service/rates", { currency, rateToBase: Number(rate) }).then(() => { toast.success("Rate saved"); qc.invalidateQueries({ queryKey: ["exchange-rates"] }); }).catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save"))}>Save</Button>
      </Card>
      <Table>
        <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Units per base</TableHead></TableRow></TableHeader>
        <TableBody>
          {(rates.data ?? []).map((row) => (
            <TableRow key={row.id}><TableCell>{row.currency}</TableCell><TableCell>{String(row.rateToBase)}</TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
