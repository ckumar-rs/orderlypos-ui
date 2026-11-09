"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import {
  useHrActions,
  useLeave,
  useLeaveBalances,
  usePay,
  usePayrollRun,
  usePayrollRuns,
  usePerformance,
  useShifts,
} from "@/hooks/use-hr";
import { ApiError } from "@/lib/api";
import { RecordFields } from "@/components/fields/record-fields";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");
const fmtDate = (s: string) => new Date(s).toLocaleDateString([], { day: "numeric", month: "short" });
const fmtTime = (s: string) => new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const TABS = ["schedule", "leave", "payroll", "performance"] as const;
type Tab = (typeof TABS)[number];

function Schedule({ branchId }: { branchId: string | null }) {
  const [from, setFrom] = useState(() => iso(new Date()));
  const to = iso(addDays(new Date(from), 6));
  const { data: shifts, isLoading } = useShifts(branchId, from, to);
  const { data: staff } = usePay(branchId);
  const { addShift, updateShift, deleteShift } = useHrActions(branchId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    userId: "",
    date: iso(new Date()),
    start: "09:00",
    end: "17:00",
    note: "",
  });

  const reset = () => {
    setEditingId(null);
    setForm({ userId: "", date: iso(new Date()), start: "09:00", end: "17:00", note: "" });
  };

  const submit = () => {
    if (!form.userId) return toast.error("Pick a staff member");
    const dto = {
      userId: form.userId,
      startsAt: new Date(`${form.date}T${form.start}`).toISOString(),
      endsAt: new Date(`${form.date}T${form.end}`).toISOString(),
      note: form.note.trim() || undefined,
    };
    if (editingId) {
      updateShift.mutate(
        { id: editingId, dto },
        {
          onSuccess: () => {
            toast.success("Shift updated");
            reset();
          },
          onError: (e) => toast.error(errMsg(e)),
        },
      );
      return;
    }
    addShift.mutate(dto, {
      onSuccess: () => {
        toast.success("Shift added");
        reset();
      },
      onError: (e) => toast.error(errMsg(e)),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
        <select
          aria-label="Staff"
          value={form.userId}
          onChange={(e) => setForm({ ...form, userId: e.target.value })}
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
        >
          <option value="">Staff…</option>
          {staff?.map((s) => (
            <option key={s.userId} value={s.userId}>
              {s.name}
            </option>
          ))}
        </select>
        <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <Input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
        <Input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
        <Input
          placeholder="Note (optional)"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
        <div className="flex gap-2">
          <Button onClick={submit} disabled={addShift.isPending || updateShift.isPending}>
            {editingId ? "Save" : "Create"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </Card>
      <div className="flex items-center gap-2 text-sm">
        <Button size="sm" variant="outline" onClick={() => setFrom(iso(addDays(new Date(from), -7)))}>← Prev</Button>
        <span className="text-muted-foreground">{fmtDate(from)} – {fmtDate(to)}</span>
        <Button size="sm" variant="outline" onClick={() => setFrom(iso(addDays(new Date(from), 7)))}>Next →</Button>
      </div>
      <Card className="flex flex-col divide-y divide-border p-2">
        {isLoading ? (
          <Skeleton className="m-4 h-12" />
        ) : shifts && shifts.length > 0 ? (
          shifts.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-foreground">{s.user.name}</p>
                {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
              </div>
              <span className="text-muted-foreground">
                {fmtDate(s.startsAt)} · {fmtTime(s.startsAt)} – {fmtTime(s.endsAt)}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const start = new Date(s.startsAt);
                    const end = new Date(s.endsAt);
                    const pad = (n: number) => String(n).padStart(2, "0");
                    setEditingId(s.id);
                    setForm({
                      userId: s.userId,
                      date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
                      start: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
                      end: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
                      note: s.note ?? "",
                    });
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    deleteShift.mutate(s.id, {
                      onSuccess: () => {
                        if (editingId === s.id) reset();
                      },
                    })
                  }
                >
                  Remove
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">No shifts this week.</p>
        )}
      </Card>
    </div>
  );
}

function Leave({ branchId }: { branchId: string | null }) {
  const year = new Date().getUTCFullYear();
  const [status, setStatus] = useState<string>("");
  const { data, isLoading } = useLeave(branchId, status || undefined);
  const { data: balances } = useLeaveBalances(branchId, year);
  const { data: staff } = usePay(branchId);
  const { decideLeave, cancelLeave, createLeaveForStaff, setLeaveBalance } = useHrActions(branchId);
  const [form, setForm] = useState({
    userId: "",
    type: "ANNUAL",
    startDate: iso(new Date()),
    endDate: iso(new Date()),
    reason: "",
    approveNow: true,
  });

  return (
    <div className="flex flex-col gap-4">
      <Card className="grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
        <select
          aria-label="Staff"
          value={form.userId}
          onChange={(e) => setForm({ ...form, userId: e.target.value })}
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
        >
          <option value="">Staff…</option>
          {staff?.map((s) => (
            <option key={s.userId} value={s.userId}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Leave type"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
        >
          <option value="ANNUAL">Annual</option>
          <option value="SICK">Sick</option>
          <option value="UNPAID">Unpaid</option>
          <option value="OTHER">Other</option>
        </select>
        <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        <Input
          placeholder="Reason (optional)"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={form.approveNow}
              onChange={(e) => setForm({ ...form, approveNow: e.target.checked })}
            />
            Approve now
          </label>
          <Button
            size="sm"
            disabled={!form.userId || createLeaveForStaff.isPending}
            onClick={() =>
              createLeaveForStaff.mutate(
                {
                  userId: form.userId,
                  type: form.type,
                  startDate: form.startDate,
                  endDate: form.endDate,
                  reason: form.reason || undefined,
                  approveNow: form.approveNow,
                },
                {
                  onSuccess: () => toast.success(form.approveNow ? "Leave booked" : "Leave request created"),
                  onError: (e) => toast.error(errMsg(e)),
                },
              )
            }
          >
            Book leave
          </Button>
        </div>
      </Card>

      <Card className="overflow-x-auto p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Balances · {year}</p>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="py-1">Staff</th>
              <th>Type</th>
              <th>Entitled</th>
              <th>Used</th>
              <th>Pending</th>
              <th>Left</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {balances?.map((b) => (
              <tr key={`${b.userId}-${b.type}`} className="border-t border-border">
                <td className="py-1.5">{b.name}</td>
                <td className="capitalize">{b.type.toLowerCase()}</td>
                <td>
                  <Input
                    className="h-8 w-20"
                    defaultValue={String(b.entitledDays)}
                    onBlur={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isFinite(next) || next === b.entitledDays) return;
                      setLeaveBalance.mutate(
                        { userId: b.userId, type: b.type, year: b.year, entitledDays: next },
                        {
                          onSuccess: () => toast.success("Entitlement saved"),
                          onError: (err) => toast.error(errMsg(err)),
                        },
                      );
                    }}
                  />
                </td>
                <td>{b.usedDays}</td>
                <td>{b.pendingDays}</td>
                <td className="font-medium">{b.remainingDays}</td>
                <td className="text-xs text-muted-foreground">{b.overridden ? "custom" : "default"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex gap-2">
        {["", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs capitalize",
              status === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
            )}
          >
            {s ? s.toLowerCase() : "all"}
          </button>
        ))}
      </div>

      <Card className="flex flex-col divide-y divide-border p-2">
        {isLoading ? (
          <Skeleton className="m-4 h-12" />
        ) : data && data.length > 0 ? (
          data.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-foreground">
                  {l.user?.name} · {l.type.toLowerCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fmtDate(l.startDate)} – {fmtDate(l.endDate)}
                  {l.reason && ` · ${l.reason}`}
                </p>
              </div>
              {l.status === "PENDING" ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => decideLeave.mutate({ id: l.id, status: "APPROVED" }, { onError: (e) => toast.error(errMsg(e)) })}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decideLeave.mutate({ id: l.id, status: "REJECTED" }, { onError: (e) => toast.error(errMsg(e)) })}>
                    Reject
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => cancelLeave.mutate(l.id, { onError: (e) => toast.error(errMsg(e)) })}>
                    Cancel
                  </Button>
                </div>
              ) : l.status === "APPROVED" ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">approved</span>
                  <Button size="sm" variant="outline" onClick={() => cancelLeave.mutate(l.id, { onError: (e) => toast.error(errMsg(e)) })}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">{l.status.toLowerCase()}</span>
              )}
            </div>
          ))
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">No leave requests.</p>
        )}
      </Card>
    </div>
  );
}

function RunDetail({ branchId, id }: { branchId: string | null; id: string }) {
  const { data } = usePayrollRun(branchId, id);
  const { finalizeRun, deleteRun, downloadPayslip } = useHrActions(branchId);
  if (!data) return <Skeleton className="h-24" />;
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {fmtDate(data.periodStart)} – {fmtDate(data.periodEnd)} · {data.status.toLowerCase()} · tip pool{" "}
          {formatCurrency(data.tipPool)}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              downloadPayslip.mutate(id, {
                onSuccess: () => toast.success("Payslip downloaded"),
                onError: (e) => toast.error(errMsg(e)),
              })
            }
          >
            Export CSV
          </Button>
          {data.status === "DRAFT" && (
            <>
              <Button size="sm" onClick={() => finalizeRun.mutate(id, { onSuccess: () => toast.success("Payroll finalized"), onError: (e) => toast.error(errMsg(e)) })}>
                Finalize
              </Button>
              <Button size="sm" variant="outline" onClick={() => deleteRun.mutate(id)}>Discard draft</Button>
            </>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="py-1">Staff</th><th>Hours</th><th>Base</th><th>PF</th><th>ESI</th><th>TDS</th><th>Leave −</th><th>Tips</th><th className="text-right">Net</th></tr>
          </thead>
          <tbody>
            {data.lines.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="py-1.5">{l.user.name}</td>
                <td>{l.hoursWorked}</td>
                <td>{formatCurrency(l.basePay)}</td>
                <td>{formatCurrency(l.pfEmployee)}</td>
                <td>{formatCurrency(l.esiEmployee)}</td>
                <td>{formatCurrency(l.tds)}</td>
                <td>{formatCurrency(l.unpaidLeaveDeduction)}</td>
                <td>{formatCurrency(l.tipShare)}</td>
                <td className="text-right font-medium">{formatCurrency(l.netPay)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-right text-sm font-semibold">Total {formatCurrency(data.totalNet)}</p>
    </Card>
  );
}

function Payroll({ branchId }: { branchId: string | null }) {
  const { data: pay } = usePay(branchId);
  const { data: runs } = usePayrollRuns(branchId);
  const { setPay, createRun } = useHrActions(branchId);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
    return { start: iso(first), end: iso(last) };
  });
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, { payType: "MONTHLY" | "HOURLY"; rate: string }>>({});

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4">
        <p className="text-sm font-medium text-foreground">Pay rates</p>
        {pay?.map((p) => {
          const d = draft[p.userId] ?? { payType: p.payType ?? "MONTHLY", rate: String(p.rate ?? "") };
          return (
            <div key={p.userId} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="w-40 truncate">{p.name}</span>
              <select
                aria-label="Pay type"
                value={d.payType}
                onChange={(e) => setDraft({ ...draft, [p.userId]: { ...d, payType: e.target.value as "MONTHLY" | "HOURLY" } })}
                className="rounded-lg border border-border bg-background px-2 py-1.5"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="HOURLY">Hourly</option>
              </select>
              <Input
                className="w-28"
                inputMode="decimal"
                placeholder="Rate"
                value={d.rate}
                onChange={(e) => setDraft({ ...draft, [p.userId]: { ...d, rate: e.target.value } })}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setPay.mutate(
                    { userId: p.userId, payType: d.payType, rate: Number(d.rate) },
                    { onSuccess: () => toast.success("Saved"), onError: (e) => toast.error(errMsg(e)) },
                  )
                }
              >
                Save
              </Button>
            </div>
              <RecordFields branchId={branchId} entity="EMPLOYEE" entityId={p.userId} title={`${p.name} fields`} />
            </div>
          );
        })}
      </Card>
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Input type="date" className="w-40" value={period.start} onChange={(e) => setPeriod({ ...period, start: e.target.value })} />
        <Input type="date" className="w-40" value={period.end} onChange={(e) => setPeriod({ ...period, end: e.target.value })} />
        <Button
          disabled={createRun.isPending}
          onClick={() =>
            createRun.mutate(
              { periodStart: period.start, periodEnd: period.end },
              {
                onSuccess: (r) => setOpen((r as { id: string }).id),
                onError: (e) => toast.error(errMsg(e)),
              },
            )
          }
        >
          Run payroll
        </Button>
        <p className="w-full text-xs text-muted-foreground">
          Uses clocked hours from Attendance, approved unpaid leave, and splits the period&rsquo;s tips by hours worked. PF/ESI rates come from Settings → Team &amp; payroll.
        </p>
      </Card>
      {runs?.map((r) => (
        <div key={r.id} className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setOpen(open === r.id ? null : r.id)}
            className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-sm hover:bg-secondary"
          >
            <span>{fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)} · {r.status.toLowerCase()}</span>
            <span className="font-medium">{formatCurrency(r.totalNet)}</span>
          </button>
          {open === r.id && <RunDetail branchId={branchId} id={r.id} />}
        </div>
      ))}
    </div>
  );
}

function Performance({ branchId }: { branchId: string | null }) {
  const [range, setRange] = useState(() => ({ from: iso(addDays(new Date(), -29)), to: iso(new Date()) }));
  const { data, isLoading } = usePerformance(branchId, range.from, range.to);
  const { data: staff } = usePay(branchId);
  const { createReview, deleteReview } = useHrActions(branchId);
  const [form, setForm] = useState({
    userId: "",
    periodStart: iso(addDays(new Date(), -29)),
    periodEnd: iso(new Date()),
    rating: "4",
    note: "",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input type="date" className="w-40" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        <Input type="date" className="w-40" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
      </div>
      <Card className="overflow-x-auto p-4">
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="py-1">Staff</th><th>Orders</th><th>Sales</th><th>Tips</th><th>Hours</th><th className="text-right">Sales / hour</th></tr>
            </thead>
            <tbody>
              {data?.metrics.map((r) => (
                <tr key={r.userId} className="border-t border-border">
                  <td className="py-1.5">{r.name}</td>
                  <td>{r.orders}</td>
                  <td>{formatCurrency(r.sales)}</td>
                  <td>{formatCurrency(r.tips)}</td>
                  <td>{r.hoursWorked}</td>
                  <td className="text-right">{r.salesPerHour == null ? "—" : formatCurrency(r.salesPerHour)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
        <select
          aria-label="Staff"
          value={form.userId}
          onChange={(e) => setForm({ ...form, userId: e.target.value })}
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
        >
          <option value="">Staff…</option>
          {staff?.map((s) => (
            <option key={s.userId} value={s.userId}>
              {s.name}
            </option>
          ))}
        </select>
        <Input type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
        <Input type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
        <select
          aria-label="Rating"
          value={form.rating}
          onChange={(e) => setForm({ ...form, rating: e.target.value })}
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} / 5
            </option>
          ))}
        </select>
        <Input placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <Button
          disabled={!form.userId || createReview.isPending}
          onClick={() =>
            createReview.mutate(
              {
                userId: form.userId,
                periodStart: form.periodStart,
                periodEnd: form.periodEnd,
                rating: Number(form.rating),
                note: form.note || undefined,
              },
              {
                onSuccess: () => {
                  toast.success("Review saved");
                  setForm({ ...form, note: "" });
                },
                onError: (e) => toast.error(errMsg(e)),
              },
            )
          }
        >
          Add review
        </Button>
      </Card>

      <Card className="flex flex-col divide-y divide-border p-2">
        {data?.reviews?.length ? (
          data.reviews.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-foreground">
                  {r.user.name} · {r.rating}/5
                </p>
                <p className="text-xs text-muted-foreground">
                  {fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)} · by {r.createdBy.name}
                </p>
                {r.note && <p className="mt-1 text-muted-foreground">{r.note}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => deleteReview.mutate(r.id)}>
                Remove
              </Button>
            </div>
          ))
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">No performance reviews in this range.</p>
        )}
      </Card>
    </div>
  );
}

export default function TeamPage() {
  const { branchId } = useBranch();
  const [tab, setTab] = useState<Tab>("schedule");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Team</h1>
        <p className="text-sm text-muted-foreground">Schedules, leave, payroll and performance</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3.5 py-1 text-xs capitalize transition-colors",
              tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "schedule" && <Schedule branchId={branchId} />}
      {tab === "leave" && <Leave branchId={branchId} />}
      {tab === "payroll" && <Payroll branchId={branchId} />}
      {tab === "performance" && <Performance branchId={branchId} />}
    </div>
  );
}
