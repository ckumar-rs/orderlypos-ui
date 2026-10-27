"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useAccountMaps,
  useAccountingActions,
  useJournals,
  useLedgerAccounts,
  useTrialBalance,
} from "@/hooks/use-accounting";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const TYPES = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"] as const;
const err = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");

export function JournalsTab({ branchId }: { branchId: string | null }) {
  const month = () => {
    const now = new Date();
    return {
      from: iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))),
      to: iso(now),
    };
  };
  const [range, setRange] = useState(month);
  const { data: accounts } = useLedgerAccounts(branchId);
  const { data: maps } = useAccountMaps(branchId);
  const { data: journals } = useJournals(branchId, range.from, range.to);
  const { data: trial } = useTrialBalance(branchId, range.from, range.to);
  const actions = useAccountingActions(branchId);
  const [account, setAccount] = useState({ code: "", name: "", type: "ASSET" });
  const [map, setMap] = useState({ sourceKey: "", accountId: "" });
  const [voucher, setVoucher] = useState({
    postedOn: iso(new Date()),
    narration: "",
    debitId: "",
    creditId: "",
    amount: "",
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Debits must equal credits. Name your own accounts, then map a source key such as CASH, SALES, UPI, or EXPENSE so paid bills and approved expenses can post themselves.
      </p>
      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-semibold">Chart of accounts</h2>
        <div className="grid gap-2 sm:grid-cols-4">
          <Input placeholder="Code" value={account.code} onChange={(e) => setAccount({ ...account, code: e.target.value })} />
          <Input placeholder="Name" value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} />
          <select
            aria-label="Account type"
            className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
            value={account.type}
            onChange={(e) => setAccount({ ...account, type: e.target.value })}
          >
            {TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <Button
            disabled={!account.code.trim() || !account.name.trim() || actions.createAccount.isPending}
            onClick={() =>
              actions.createAccount.mutate(account, {
                onSuccess: () => setAccount({ ...account, code: "", name: "" }),
                onError: (e) => toast.error(err(e)),
              })
            }
          >
            Add account
          </Button>
        </div>
        <div className="flex flex-col divide-y divide-border text-sm">
          {(accounts ?? []).map((row) => (
            <div key={row.id} className="flex justify-between py-1.5">
              <span>{row.code} · {row.name}</span>
              <span className="text-muted-foreground">{row.type}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-semibold">Auto-post maps</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input placeholder="Source key (CASH, SALES…)" value={map.sourceKey} onChange={(e) => setMap({ ...map, sourceKey: e.target.value })} />
          <select
            aria-label="Map account"
            className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
            value={map.accountId}
            onChange={(e) => setMap({ ...map, accountId: e.target.value })}
          >
            <option value="">Account</option>
            {(accounts ?? []).map((row) => (
              <option key={row.id} value={row.id}>{row.code} {row.name}</option>
            ))}
          </select>
          <Button
            disabled={!map.sourceKey.trim() || !map.accountId}
            onClick={() =>
              actions.upsertMap.mutate(map, {
                onSuccess: () => setMap({ sourceKey: "", accountId: "" }),
                onError: (e) => toast.error(err(e)),
              })
            }
          >
            Save map
          </Button>
        </div>
        {(maps ?? []).map((row) => (
          <div key={row.id} className="flex justify-between text-sm">
            <span>{row.sourceKey} → {row.account.code} {row.account.name}</span>
            <Button size="sm" variant="outline" onClick={() => actions.deleteMap.mutate(row.id)}>Remove</Button>
          </div>
        ))}
        <Button
          variant="outline"
          className="self-start"
          onClick={() =>
            actions.autoPost.mutate(undefined, {
              onSuccess: (res) => toast.success(`Posted ${(res as { created?: number }).created ?? 0} missing journals`),
              onError: (e) => toast.error(err(e)),
            })
          }
        >
          Post missing sales and expenses
        </Button>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-semibold">Journal voucher</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Input type="date" value={voucher.postedOn} onChange={(e) => setVoucher({ ...voucher, postedOn: e.target.value })} />
          <Input placeholder="Narration" value={voucher.narration} onChange={(e) => setVoucher({ ...voucher, narration: e.target.value })} />
          <select aria-label="Debit account" className="rounded-lg border border-border bg-background px-2 py-2 text-sm" value={voucher.debitId} onChange={(e) => setVoucher({ ...voucher, debitId: e.target.value })}>
            <option value="">Debit account</option>
            {(accounts ?? []).map((row) => <option key={row.id} value={row.id}>{row.code} {row.name}</option>)}
          </select>
          <select aria-label="Credit account" className="rounded-lg border border-border bg-background px-2 py-2 text-sm" value={voucher.creditId} onChange={(e) => setVoucher({ ...voucher, creditId: e.target.value })}>
            <option value="">Credit account</option>
            {(accounts ?? []).map((row) => <option key={row.id} value={row.id}>{row.code} {row.name}</option>)}
          </select>
          <Input placeholder="Amount" inputMode="decimal" value={voucher.amount} onChange={(e) => setVoucher({ ...voucher, amount: e.target.value })} />
        </div>
        <Button
          className="self-start"
          disabled={actions.postJournal.isPending}
          onClick={() => {
            const amount = Number(voucher.amount);
            if (!voucher.narration.trim() || !(amount > 0) || !voucher.debitId || !voucher.creditId) {
              return toast.error("Enter narration, two accounts, and an amount");
            }
            actions.postJournal.mutate(
              {
                postedOn: voucher.postedOn,
                narration: voucher.narration.trim(),
                lines: [
                  { accountId: voucher.debitId, debit: amount, credit: 0 },
                  { accountId: voucher.creditId, debit: 0, credit: amount },
                ],
              },
              {
                onSuccess: () => {
                  toast.success("Journal posted");
                  setVoucher({ ...voucher, narration: "", amount: "" });
                },
                onError: (e) => toast.error(err(e)),
              },
            );
          }}
        >
          Post journal
        </Button>
      </Card>

      <div className="flex gap-2">
        <Input type="date" className="w-40" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        <Input type="date" className="w-40" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
      </div>
      <Card className="overflow-x-auto p-4">
        <h2 className="mb-2 text-sm font-semibold">Trial balance</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="py-1">Account</th><th>Debit</th><th className="text-right">Credit</th></tr>
          </thead>
          <tbody>
            {(trial?.rows ?? []).map((row) => (
              <tr key={row.code} className="border-t border-border">
                <td className="py-1.5">{row.code} {row.name}</td>
                <td>{formatCurrency(row.debit)}</td>
                <td className="text-right">{formatCurrency(row.credit)}</td>
              </tr>
            ))}
            <tr className="border-t border-border font-semibold">
              <td className="py-1.5">Total</td>
              <td>{formatCurrency(trial?.totalDebit ?? 0)}</td>
              <td className="text-right">{formatCurrency(trial?.totalCredit ?? 0)}</td>
            </tr>
          </tbody>
        </table>
      </Card>
      <Card className="flex flex-col divide-y divide-border p-2">
        {(journals ?? []).map((row) => (
          <div key={row.id} className="px-4 py-2 text-sm">
            <p className="font-medium">{row.number} · {row.postedOn.slice(0, 10)} · {row.narration}</p>
            <p className="text-xs text-muted-foreground">
              {row.lines.map((line) => `${line.account.code} ${Number(line.debit) ? `Dr ${formatCurrency(line.debit)}` : `Cr ${formatCurrency(line.credit)}`}`).join(" · ")}
            </p>
          </div>
        ))}
        {(journals?.length ?? 0) === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No journals in this range.</p>}
      </Card>
    </div>
  );
}
