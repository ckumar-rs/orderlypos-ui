"use client";

import { Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { flattenCategories, useCategories } from "@/hooks/use-menu";
import { useBranch } from "@/hooks/use-branch";
import {
  useAudience,
  useCampaignReport,
  useCampaigns,
  useCoupons,
  useMarketingActions,
  usePromotions,
  type CampaignReportCounts,
  type CampaignRow,
} from "@/hooks/use-marketing";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TABS = ["coupons", "happy hour", "campaigns"] as const;
type Tab = (typeof TABS)[number];
const discountText = (kind: string, value: string, buy?: number | null, get?: number | null) =>
  kind === "BOGO"
    ? `Buy ${buy ?? 1} get ${get ?? 1}`
    : kind === "PERCENT"
      ? `${Number(value)}% off`
      : `${formatCurrency(value)} off`;

function Coupons({ branchId }: { branchId: string | null }) {
  const { data, isLoading } = useCoupons(branchId);
  const { createCoupon, updateCoupon, couponActive, deleteCoupon } = useMarketingActions(branchId);
  const blank = { code: "", kind: "PERCENT", value: "", minOrderAmount: "", usageLimit: "" };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [f, setF] = useState(blank);
  const pending = createCoupon.isPending || updateCoupon.isPending;
  const reset = () => {
    setEditingId(null);
    setF(blank);
  };

  const submit = () => {
    const dto = {
      code: f.code,
      kind: f.kind,
      value: Number(f.value),
      minOrderAmount: f.minOrderAmount ? Number(f.minOrderAmount) : 0,
      usageLimit: f.usageLimit ? Number(f.usageLimit) : null,
    };
    if (editingId) {
      updateCoupon.mutate(
        { id: editingId, dto },
        {
          onSuccess: () => {
            toast.success("Coupon updated");
            reset();
          },
          onError: (e) => toast.error(errMsg(e)),
        },
      );
      return;
    }
    createCoupon.mutate(dto, {
      onSuccess: () => {
        toast.success("Coupon created");
        reset();
      },
      onError: (e) => toast.error(errMsg(e)),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <Input placeholder="CODE" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
        <select aria-label="Type" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
          <option value="PERCENT">Percent</option>
          <option value="FLAT">Flat amount</option>
        </select>
        <Input placeholder="Value" inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
        <Input placeholder="Min order" inputMode="decimal" value={f.minOrderAmount} onChange={(e) => setF({ ...f, minOrderAmount: e.target.value })} />
        <Input placeholder="Max uses" inputMode="numeric" value={f.usageLimit} onChange={(e) => setF({ ...f, usageLimit: e.target.value })} />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={submit} disabled={pending}>
            {editingId ? "Save" : "Create"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </Card>
      <Card className="flex flex-col divide-y divide-border p-2">
        {isLoading ? (
          <Skeleton className="m-4 h-12" />
        ) : data && data.length > 0 ? (
          data.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className={cn("font-mono font-medium", !c.isActive && "text-muted-foreground line-through")}>{c.code}</p>
                <p className="text-xs text-muted-foreground">
                  {discountText(c.kind, c.value)}
                  {Number(c.minOrderAmount) > 0 && ` · min ${formatCurrency(c.minOrderAmount)}`}
                  {` · used ${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ""}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(c.id);
                    setF({
                      code: c.code,
                      kind: c.kind,
                      value: String(Number(c.value)),
                      minOrderAmount: Number(c.minOrderAmount) > 0 ? String(Number(c.minOrderAmount)) : "",
                      usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
                    });
                  }}
                >
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => couponActive.mutate({ id: c.id, isActive: !c.isActive })}>
                  {c.isActive ? "Disable" : "Enable"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => confirm(`Delete coupon ${c.code}?`) && deleteCoupon.mutate(c.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">No coupons yet.</p>
        )}
      </Card>
      <p className="text-xs text-muted-foreground">
        Cashiers enter a code at checkout. A coupon never stacks with a happy-hour discount — the bigger one applies.
      </p>
    </div>
  );
}

function HappyHour({ branchId }: { branchId: string | null }) {
  const { data, isLoading } = usePromotions(branchId);
  const { createPromotion, updatePromotion, promotionActive, deletePromotion } = useMarketingActions(branchId);
  const blank = {
    name: "",
    kind: "PERCENT",
    value: "",
    buy: "1",
    get: "1",
    audience: "ALL",
    start: "16:00",
    end: "19:00",
    days: [1, 2, 3, 4, 5] as number[],
    categoryId: "",
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [f, setF] = useState(blank);
  const pending = createPromotion.isPending || updatePromotion.isPending;
  const { data: categories } = useCategories(branchId);
  const toggleDay = (d: number) => setF({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] });
  const reset = () => {
    setEditingId(null);
    setF(blank);
  };

  const submit = () => {
    const dto = {
      name: f.name,
      kind: f.kind,
      value: f.kind === "BOGO" ? 0 : Number(f.value),
      buyQuantity: f.kind === "BOGO" ? Number(f.buy) : undefined,
      getQuantity: f.kind === "BOGO" ? Number(f.get) : undefined,
      audience: f.audience as "ALL" | "STAFF",
      categoryId: f.categoryId || null,
      daysOfWeek: f.days,
      startTime: f.start,
      endTime: f.end,
    };
    if (editingId) {
      updatePromotion.mutate(
        { id: editingId, dto },
        {
          onSuccess: () => {
            toast.success("Happy hour updated");
            reset();
          },
          onError: (e) => toast.error(errMsg(e)),
        },
      );
      return;
    }
    createPromotion.mutate(dto, {
      onSuccess: () => {
        toast.success("Happy hour created");
        reset();
      },
      onError: (e) => toast.error(errMsg(e)),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input placeholder="Name (e.g. Weekday happy hour)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <select aria-label="Type" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
            <option value="PERCENT">Percent</option>
            <option value="FLAT">Flat amount</option>
            <option value="BOGO">Buy X get Y</option>
          </select>
          {f.kind === "BOGO" ? (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Buy" inputMode="numeric" value={f.buy} onChange={(e) => setF({ ...f, buy: e.target.value })} />
              <Input placeholder="Get" inputMode="numeric" value={f.get} onChange={(e) => setF({ ...f, get: e.target.value })} />
            </div>
          ) : (
            <Input placeholder="Value" inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
          )}
          <Input type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />
          <Input type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {DAY_NAMES.map((n, d) => (
            <button key={n} type="button" onClick={() => toggleDay(d)} className={cn("rounded-full border px-3 py-1 text-xs", f.days.includes(d) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>
              {n}
            </button>
          ))}
          <select
            aria-label="Audience"
            value={f.audience}
            onChange={(e) => setF({ ...f, audience: e.target.value })}
            className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
          >
            <option value="ALL">Everyone</option>
            <option value="STAFF">Staff only</option>
          </select>
          <select
            aria-label="Category"
            value={f.categoryId}
            onChange={(e) => setF({ ...f, categoryId: e.target.value })}
            className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
          >
            <option value="">Whole bill</option>
            {flattenCategories(categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {`${"— ".repeat(category.depth)}${category.name}`}
              </option>
            ))}
          </select>
          <div className="ml-auto flex gap-2">
            <Button onClick={submit} disabled={pending}>
              {editingId ? "Save" : "Create"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>
      <Card className="flex flex-col divide-y divide-border p-2">
        {isLoading ? (
          <Skeleton className="m-4 h-12" />
        ) : data && data.length > 0 ? (
          data.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className={cn("font-medium", !p.isActive && "text-muted-foreground line-through")}>{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {discountText(p.kind, p.value, p.buyQuantity, p.getQuantity)}
                  {p.audience === "STAFF" ? " · staff" : ""}
                  {p.categoryId ? ` · ${categories?.find((c) => c.id === p.categoryId)?.name ?? "category"}` : ""}
                  {" · "}{p.daysOfWeek.map((d) => DAY_NAMES[d]).join(", ")} · {p.startTime}–{p.endTime}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(p.id);
                    setF({
                      name: p.name,
                      kind: p.kind,
                      value: p.kind === "BOGO" ? "" : String(Number(p.value)),
                      buy: String(p.buyQuantity ?? 1),
                      get: String(p.getQuantity ?? 1),
                      audience: p.audience ?? "ALL",
                      start: p.startTime,
                      end: p.endTime,
                      days: [...p.daysOfWeek],
                      categoryId: p.categoryId ?? "",
                    });
                  }}
                >
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => promotionActive.mutate({ id: p.id, isActive: !p.isActive })}>
                  {p.isActive ? "Pause" : "Resume"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => confirm(`Delete ${p.name}?`) && deletePromotion.mutate(p.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">No happy hours yet.</p>
        )}
      </Card>
      <p className="text-xs text-muted-foreground">Applied automatically at checkout during the window, in the restaurant&rsquo;s timezone.</p>
    </div>
  );
}

function AudienceCount({ branchId, id }: { branchId: string | null; id: string }) {
  const { data } = useAudience(branchId, id);
  return <span>{data ? `${data.count} recipients` : "…"}</span>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function CountGrid({ counts }: { counts: CampaignReportCounts }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      <Stat label="Total" value={counts.total} />
      <Stat label="Queued" value={counts.QUEUED} />
      <Stat label="Sent" value={counts.SENT} />
      <Stat label="Delivered" value={counts.DELIVERED} />
      <Stat label="Read" value={counts.READ} />
      <Stat label="Failed" value={counts.FAILED} />
      <Stat label="Opted out" value={counts.OPTED_OUT} />
    </div>
  );
}

function CampaignReportPanel({
  branchId,
  campaign,
  onClose,
}: {
  branchId: string | null;
  campaign: CampaignRow;
  onClose: () => void;
}) {
  const [batchId, setBatchId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const { data, isLoading, isFetching, refetch } = useCampaignReport(
    branchId,
    campaign.id,
    batchId,
    status || null,
  );
  const csvHref = branchId
    ? `/api/v1/marketing/campaigns/${campaign.id}/report.csv?branchId=${branchId}${batchId ? `&batchId=${batchId}` : ""}${status ? `&status=${status}` : ""}`
    : "#";

  return (
    <Card className="flex flex-col gap-4 border-primary/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            Delivery report · {campaign.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {campaign.channel} · refreshes every 15s while open
            {isFetching ? " · updating…" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
          <a
            href={csvHref}
            className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm hover:bg-secondary"
          >
            <Download className="mr-2 h-4 w-4" /> Report CSV
          </a>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-24" />
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <select
              aria-label="Send batch"
              value={batchId ?? data.batchId ?? ""}
              onChange={(e) => setBatchId(e.target.value || null)}
              className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
            >
              {(data.batches.length ? data.batches : data.batchId ? [{ id: data.batchId, createdAt: "" }] : []).map(
                (b) => (
                  <option key={b.id} value={b.id}>
                    Batch {b.id}
                    {b.createdAt ? ` · ${new Date(b.createdAt).toLocaleString()}` : ""}
                  </option>
                ),
              )}
              {!data.batches.length && !data.batchId && (
                <option value="">No sends yet</option>
              )}
            </select>
            <select
              aria-label="Status filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="QUEUED">Queued</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="READ">Read</option>
              <option value="FAILED">Failed</option>
              <option value="OPTED_OUT">Opted out</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              This send
            </p>
            <CountGrid counts={data.batch} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              All sends for this campaign
            </p>
            <CountGrid counts={data.overall} />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-secondary/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">To</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Provider</th>
                  <th className="px-3 py-2 font-medium">Sent</th>
                  <th className="px-3 py-2 font-medium">Delivered</th>
                  <th className="px-3 py-2 font-medium">Read</th>
                  <th className="px-3 py-2 font-medium">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.messages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                      No outbound messages for this campaign yet. Send it once delivery
                      tracking can fill in.
                    </td>
                  </tr>
                ) : (
                  data.messages.map((m) => (
                    <tr key={m.id}>
                      <td className="px-3 py-2 font-mono text-xs">{m.to}</td>
                      <td className="px-3 py-2">{m.status}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {m.provider ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {m.sentAt ? new Date(m.sentAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {m.deliveredAt ? new Date(m.deliveredAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {m.readAt ? new Date(m.readAt).toLocaleString() : "—"}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2 text-xs text-destructive">
                        {m.error ?? ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

function Campaigns({ branchId }: { branchId: string | null }) {
  const { data, isLoading } = useCampaigns(branchId);
  const { createCampaign, updateCampaign, deleteCampaign, sendCampaign } = useMarketingActions(branchId);
  const [reportId, setReportId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const blank = {
    name: "",
    channel: "SMS",
    segment: "ALL",
    message: "",
    tierId: "",
    rfmLabel: "",
  };
  const [f, setF] = useState(blank);
  const pending = createCampaign.isPending || updateCampaign.isPending;
  const reset = () => {
    setEditingId(null);
    setF(blank);
  };
  const loadEdit = (c: CampaignRow) => {
    setEditingId(c.id);
    setF({
      name: c.name,
      channel: c.channel,
      segment: c.segment,
      message: c.message,
      tierId: c.tierId ?? "",
      rfmLabel: c.rfmLabel ?? "",
    });
  };
  const { data: tiers } = useQuery({
    queryKey: ["customers", "tiers", branchId],
    queryFn: () => api.get<{ id: string; name: string }[]>(`/customers/tiers?branchId=${branchId}`),
    enabled: !!branchId,
  });
  const { data: segments } = useQuery({
    queryKey: ["customers", "segments", branchId],
    queryFn: () =>
      api.get<{
        all: number;
        loyal: number;
        lapsed: number;
        birthdayMonth: number;
        rfm?: { name: string; count: number }[];
      }>(`/customers/segments?branchId=${branchId}`),
    enabled: !!branchId,
  });
  const { data: rfmLabels } = useQuery({
    queryKey: ["customers", "rfm-labels", branchId],
    queryFn: () => api.get<{ id: string; name: string }[]>(`/customers/rfm/labels?branchId=${branchId}`),
    enabled: !!branchId,
  });

  const submit = () => {
    const dto = {
      name: f.name,
      channel: f.channel,
      segment: f.segment,
      message: f.message,
      ...(f.segment === "TIER" && f.tierId ? { tierId: f.tierId } : {}),
      ...(f.segment === "RFM" && f.rfmLabel ? { rfmLabel: f.rfmLabel } : {}),
    };
    if (editingId) {
      updateCampaign.mutate(
        { id: editingId, dto },
        {
          onSuccess: () => {
            toast.success("Campaign updated");
            reset();
          },
          onError: (e) => toast.error(errMsg(e)),
        },
      );
      return;
    }
    createCampaign.mutate(dto, {
      onSuccess: () => {
        toast.success("Campaign created");
        reset();
      },
      onError: (e) => toast.error(errMsg(e)),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {segments && (
        <p className="text-sm text-muted-foreground">
          {segments.all} guests · {segments.loyal} loyal · {segments.lapsed} lapsed · {segments.birthdayMonth} birthday this month
          {(segments.rfm ?? []).map((row) => ` · ${row.name} ${row.count}`).join("")}
        </p>
      )}
      <Card className="flex flex-col gap-3 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input placeholder="Campaign name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <select aria-label="Channel" value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
            <option value="SMS">SMS</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">Email</option>
          </select>
          <select aria-label="Audience" value={f.segment} onChange={(e) => setF({ ...f, segment: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
            <option value="ALL">All customers</option>
            <option value="LOYAL">Loyal (5+ orders)</option>
            <option value="LAPSED">Lapsed (60+ days)</option>
            <option value="BIRTHDAY_MONTH">Birthday this month</option>
            <option value="TIER">Membership tier</option>
            <option value="RFM">RFM label</option>
          </select>
        </div>
        {f.segment === "TIER" && (
          <select aria-label="Membership tier" value={f.tierId} onChange={(e) => setF({ ...f, tierId: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
            <option value="">Choose a tier</option>
            {(tiers ?? []).map((tier) => (
              <option key={tier.id} value={tier.id}>{tier.name}</option>
            ))}
          </select>
        )}
        {f.segment === "RFM" && (
          <select aria-label="RFM label" value={f.rfmLabel} onChange={(e) => setF({ ...f, rfmLabel: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
            <option value="">Choose an RFM label</option>
            {(rfmLabels ?? []).map((label) => (
              <option key={label.id} value={label.name}>{label.name}</option>
            ))}
          </select>
        )}
        <textarea
          aria-label="Message"
          placeholder="Message"
          maxLength={600}
          value={f.message}
          onChange={(e) => setF({ ...f, message: e.target.value })}
          className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <Button disabled={pending || !f.name.trim() || !f.message.trim()} onClick={submit}>
            {editingId ? "Save" : "Create"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </Card>
      {reportId && data?.find((c) => c.id === reportId) && (
        <CampaignReportPanel
          branchId={branchId}
          campaign={data.find((c) => c.id === reportId)!}
          onClose={() => setReportId(null)}
        />
      )}
      <Card className="flex flex-col divide-y divide-border p-2">
        {isLoading ? (
          <Skeleton className="m-4 h-12" />
        ) : data && data.length > 0 ? (
          data.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-foreground">{c.name} <span className="text-xs text-muted-foreground">· {c.channel.toLowerCase()} · {c.segment.toLowerCase().replace("_", " ")}</span></p>
                <p className="text-xs text-muted-foreground">{c.message}</p>
                <p className="text-xs text-muted-foreground">
                  <AudienceCount branchId={branchId} id={c.id} />
                  {c.lastSentAt && ` · last sent ${new Date(c.lastSentAt).toLocaleString()} to ${c.lastSentCount ?? 0}`}
                </p>
              </div>
              <div className="flex gap-2">
                <a href={`/api/v1/marketing/campaigns/${c.id}/audience.csv?branchId=${branchId}`} className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm hover:bg-secondary">
                  <Download className="mr-2 h-4 w-4" /> Audience CSV
                </a>
                <Button
                  size="sm"
                  variant={reportId === c.id ? "default" : "outline"}
                  onClick={() => setReportId(reportId === c.id ? null : c.id)}
                >
                  Report
                </Button>
                <Button size="sm" variant="outline" onClick={() => loadEdit(c)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  disabled={sendCampaign.isPending}
                  onClick={() =>
                    confirm(`Send "${c.name}" now to everyone in this audience?`) &&
                    sendCampaign.mutate(c.id, {
                      onSuccess: (r) => {
                        toast.success(`Sent to ${r.sent}${r.failed ? `, ${r.failed} failed` : ""}`);
                        setReportId(c.id);
                      },
                      onError: (e) => toast.error(errMsg(e)),
                    })
                  }
                >
                  Send now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!confirm(`Delete ${c.name}?`)) return;
                    deleteCampaign.mutate(c.id, {
                      onSuccess: () => {
                        if (editingId === c.id) reset();
                      },
                    });
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">No campaigns yet.</p>
        )}
      </Card>
      <p className="text-xs text-muted-foreground">
        Email uses the restaurant SMTP settings. SMS and WhatsApp send through the provider saved in Operations
        when that channel is on; a <code>campaign.message</code> webhook still fires if one is subscribed.
        WhatsApp/SMS delivery, read and failure counts appear in Report after a send (bulk platform status
        callbacks fill delivered/read). Customers marked &ldquo;do not send marketing&rdquo; are always excluded.
      </p>
    </div>
  );
}

export default function MarketingPage() {
  const { branchId } = useBranch();
  const [tab, setTab] = useState<Tab>("coupons");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3.5 py-1 text-xs capitalize transition-colors",
              tab === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-secondary",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "coupons" && <Coupons branchId={branchId} />}
      {tab === "happy hour" && <HappyHour branchId={branchId} />}
      {tab === "campaigns" && <Campaigns branchId={branchId} />}
    </div>
  );
}
