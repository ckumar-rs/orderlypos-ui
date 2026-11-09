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
  const blankAccount = { code: "", name: "", type: "ASSET" };
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [account, setAccount] = useState(blankAccount);
  const [editingMapId, setEditingMapId] = useState<string | null>(null);
  const [map, setMap] = useState({ sourceKey: "", accountId: "" });
  const blankLine = { accountId: "", debit: "", credit: "" };
  const [voucher, setVoucher] = useState({
    postedOn: iso(new Date()),
    narration: "",
    lines: [{ ...blankLine }, { ...blankLine }],
  });
  const accountPending = actions.createAccount.isPending || actions.updateAccount.isPending;
  const resetAccount = () => {
    setEditingAccountId(null);
    setAccount(blankAccount);
  };
  const resetMap = () => {
    setEditingMapId(null);
    setMap({ sourceKey: "", accountId: "" });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Debits must equal credits. Name your own accounts, then map a source key such as CASH, SALES, UPI, or EXPENSE so paid bills and approved expenses can post themselves.
      </p>
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Chart of accounts</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={actions.seedDefaults.isPending}
            onClick={() =>
              actions.seedDefaults.mutate(undefined, {
                onSuccess: () => toast.success("Default accounts created"),
                onError: (e) => toast.error(err(e)),
              })
            }
          >
            Seed default accounts
          </Button>
        </div>
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
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={!account.code.trim() || !account.name.trim() || accountPending}
              onClick={() => {
                if (editingAccountId) {
                  actions.updateAccount.mutate(
                    { id: editingAccountId, dto: account },
                    {
                      onSuccess: () => {
                        toast.success("Account updated");
                        resetAccount();
                      },
                      onError: (e) => toast.error(err(e)),
                    },
                  );
                  return;
                }
                actions.createAccount.mutate(account, {
                  onSuccess: () => {
                    toast.success("Account created");
                    resetAccount();
                  },
                  onError: (e) => toast.error(err(e)),
                });
              }}
            >
              {editingAccountId ? "Save" : "Create"}
            </Button>
            {editingAccountId && (
              <Button variant="outline" onClick={resetAccount}>
                Cancel
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col divide-y divide-border text-sm">
          {(accounts ?? []).map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
              <span>{row.code} · {row.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{row.type}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingAccountId(row.id);
                    setAccount({ code: row.code, name: row.name, type: row.type });
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!confirm(`Delete account ${row.code}?`)) return;
                    actions.deleteAccount.mutate(row.id, {
                      onSuccess: () => {
                        toast.success("Account deleted");
                        if (editingAccountId === row.id) resetAccount();
                      },
                      onError: (e) => toast.error(err(e)),
                    });
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-semibold">Auto-post maps</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            placeholder="Source key (CASH, SALES…)"
            value={map.sourceKey}
            onChange={(e) => setMap({ ...map, sourceKey: e.target.value })}
            disabled={!!editingMapId}
          />
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
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={!map.sourceKey.trim() || !map.accountId || actions.upsertMap.isPending}
              onClick={() =>
                actions.upsertMap.mutate(map, {
                  onSuccess: () => {
                    toast.success(editingMapId ? "Map updated" : "Map saved");
                    resetMap();
                  },
                  onError: (e) => toast.error(err(e)),
                })
              }
            >
              {editingMapId ? "Save" : "Create"}
            </Button>
            {editingMapId && (
              <Button variant="outline" onClick={resetMap}>
                Cancel
              </Button>
            )}
          </div>
        </div>
        {(maps ?? []).map((row) => (
          <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>{row.sourceKey} → {row.account.code} {row.account.name}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingMapId(row.id);
                  setMap({ sourceKey: row.sourceKey, accountId: row.account.id });
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!confirm(`Remove map ${row.sourceKey}?`)) return;
                  actions.deleteMap.mutate(row.id, {
                    onSuccess: () => {
                      if (editingMapId === row.id) resetMap();
                    },
                    onError: (e) => toast.error(err(e)),
                  });
                }}
              >
                Delete
              </Button>
            </div>
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
        <div className="grid gap-2 sm:grid-cols-2">
          <Input type="date" value={voucher.postedOn} onChange={(e) => setVoucher({ ...voucher, postedOn: e.target.value })} />
          <Input placeholder="Narration" value={voucher.narration} onChange={(e) => setVoucher({ ...voucher, narration: e.target.value })} />
        </div>
        <div className="flex flex-col gap-2">
          {voucher.lines.map((line, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-4">
              <select
                aria-label={`Line ${idx + 1} account`}
                className="rounded-lg border border-border bg-background px-2 py-2 text-sm sm:col-span-2"
                value={line.accountId}
                onChange={(e) => {
                  const lines = [...voucher.lines];
                  lines[idx] = { ...lines[idx], accountId: e.target.value };
                  setVoucher({ ...voucher, lines });
                }}
              >
                <option value="">Account</option>
                {(accounts ?? []).map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.code} {row.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Debit"
                inputMode="decimal"
                value={line.debit}
                onChange={(e) => {
                  const lines = [...voucher.lines];
                  lines[idx] = { ...lines[idx], debit: e.target.value, credit: e.target.value ? "" : lines[idx].credit };
                  setVoucher({ ...voucher, lines });
                }}
              />
              <Input
                placeholder="Credit"
                inputMode="decimal"
                value={line.credit}
                onChange={(e) => {
                  const lines = [...voucher.lines];
                  lines[idx] = { ...lines[idx], credit: e.target.value, debit: e.target.value ? "" : lines[idx].debit };
                  setVoucher({ ...voucher, lines });
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVoucher({ ...voucher, lines: [...voucher.lines, { ...blankLine }] })}
          >
            Add line
          </Button>
          {voucher.lines.length > 2 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVoucher({ ...voucher, lines: voucher.lines.slice(0, -1) })}
            >
              Remove line
            </Button>
          )}
        </div>
        <Button
          className="self-start"
          disabled={actions.postJournal.isPending}
          onClick={() => {
            if (!voucher.narration.trim()) return toast.error("Enter a narration");
            const lines = voucher.lines
              .map((line) => ({
                accountId: line.accountId,
                debit: Number(line.debit) || 0,
                credit: Number(line.credit) || 0,
              }))
              .filter((line) => line.accountId && (line.debit > 0 || line.credit > 0));
            if (lines.length < 2) return toast.error("Add at least two lines with accounts and amounts");
            const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
            const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
            if (Math.abs(totalDebit - totalCredit) > 0.001) {
              return toast.error(`Debits (${totalDebit}) must equal credits (${totalCredit})`);
            }
            actions.postJournal.mutate(
              {
                postedOn: voucher.postedOn,
                narration: voucher.narration.trim(),
                lines,
              },
              {
                onSuccess: () => {
                  toast.success("Journal posted");
                  setVoucher({ ...voucher, narration: "", lines: [{ ...blankLine }, { ...blankLine }] });
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
          <div key={row.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-2 text-sm">
            <div>
              <p className="font-medium">{row.number} · {row.postedOn.slice(0, 10)} · {row.narration}</p>
              <p className="text-xs text-muted-foreground">
                {row.lines.map((line) => `${line.account.code} ${Number(line.debit) ? `Dr ${formatCurrency(line.debit)}` : `Cr ${formatCurrency(line.credit)}`}`).join(" · ")}
                {row.sourceType !== "MANUAL" ? ` · ${row.sourceType.toLowerCase()}` : ""}
              </p>
            </div>
            {row.sourceType !== "REVERSE" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  actions.reverseJournal.mutate(row.id, {
                    onSuccess: () => toast.success("Reversing voucher posted"),
                    onError: (e) => toast.error(err(e)),
                  })
                }
              >
                Reverse
              </Button>
            )}
          </div>
        ))}
        {(journals?.length ?? 0) === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No journals in this range.</p>}
      </Card>
    </div>
  );
}
