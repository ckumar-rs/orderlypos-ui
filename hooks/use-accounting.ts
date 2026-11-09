"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ExpenseRow {
  id: string;
  spentOn: string;
  category: string;
  amount: string;
  note: string | null;
  vendor?: string | null;
  paidFromCash: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  attachments?: { id: string; fileName: string; mimeType: string; size: number }[];
}
export interface ClosingPreview {
  businessDate: string;
  openingFloat: number;
  suggestedOpeningFloat: number;
  cashSales: number;
  cashExpenses: number;
  expectedCash: number;
  varianceWarnAmount: number;
  pettyCashInTillClose?: boolean;
  pettyNetOut?: number;
}
export interface ClosingRow {
  id: string;
  businessDate: string;
  expectedCash: string;
  countedCash: string;
  variance: string;
  note: string | null;
  bankDrop?: string;
  safeDrop?: string;
}
export interface ProfitLoss {
  orders: number;
  grossCollected: number;
  taxCollected: number;
  refunds: number;
  netSales: number;
  cogs: number;
  grossProfit: number;
  expenses: { category: string; amount: number }[];
  totalExpenses: number;
  payrollCost: number;
  netProfit: number;
}
export interface GstReport {
  orders: number;
  rows: { ratePercent: number; taxableValue: number; tax: number; total: number }[];
  totalTaxable: number;
  totalTax: number;
}
export interface BranchRow {
  branchId: string;
  name: string;
  orders: number;
  sales: number;
  openOrders: number;
  lowStockItems: number;
  inventoryValue: number;
}

const q = (b: string | null) => `branchId=${b}`;

export function usePettyCash(branchId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["acct", "petty", branchId, from, to],
    queryFn: () =>
      api.get<{ balance: number; entries: { id: string; spentOn: string; direction: "IN" | "OUT"; amount: string; reason: string }[] }>(
        `/accounting/petty-cash?${q(branchId)}&from=${from}&to=${to}`,
      ),
    enabled: !!branchId,
  });
}
export function useExpenses(branchId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["acct", "expenses", branchId, from, to],
    queryFn: () => api.get<ExpenseRow[]>(`/accounting/expenses?${q(branchId)}&from=${from}&to=${to}`),
    enabled: !!branchId,
  });
}
export function useClosingPreview(
  branchId: string | null,
  date: string,
  openingFloat?: number | null,
) {
  const floatQs =
    openingFloat == null || Number.isNaN(openingFloat)
      ? ""
      : `&openingFloat=${openingFloat}`;
  return useQuery({
    queryKey: ["acct", "preview", branchId, date, openingFloat ?? "auto"],
    queryFn: () =>
      api.get<ClosingPreview>(
        `/accounting/closing/preview?${q(branchId)}&date=${date}${floatQs}`,
      ),
    enabled: !!branchId,
  });
}
export function useClosings(branchId: string | null) {
  return useQuery({
    queryKey: ["acct", "closings", branchId],
    queryFn: () => api.get<ClosingRow[]>(`/accounting/closing?${q(branchId)}`),
    enabled: !!branchId,
  });
}
export function useProfitLoss(branchId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["acct", "pnl", branchId, from, to],
    queryFn: () => api.get<ProfitLoss>(`/accounting/profit-loss?${q(branchId)}&from=${from}&to=${to}`),
    enabled: !!branchId,
  });
}
export function useGst(branchId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["acct", "gst", branchId, from, to],
    queryFn: () => api.get<GstReport>(`/accounting/gst?${q(branchId)}&from=${from}&to=${to}`),
    enabled: !!branchId,
  });
}

export interface GstBillingReport {
  from: string;
  to: string;
  branchName: string;
  gstin: string | null;
  stateCode: string | null;
  requirements: { id: string; done: boolean; label: string; detail: string }[];
  documents: {
    orderNumber: string;
    billedAt: string;
    guestName: string | null;
    kind: "TAX_INVOICE" | "BILL_OF_SUPPLY";
    supply: "INTRA" | "INTER";
    taxable: number;
    tax: number;
    cgst: number;
    sgst: number;
    utgst: number;
    igst: number;
    total: number;
  }[];
  creditNotes: { orderNumber: string; amount: number; createdAt: string; taxable: number; cgst: number; sgst: number; utgst: number; igst: number }[];
  hsn: { code: string; taxable: number; tax: number; total: number }[];
  rates: GstReport;
  cgst: number;
  sgst: number;
  utgst: number;
  igst: number;
}

export function useGstBilling(branchId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["acct", "gst-billing", branchId, from, to],
    queryFn: () => api.get<GstBillingReport>(`/accounting/gst/billing?${q(branchId)}&from=${from}&to=${to}`),
    enabled: !!branchId,
  });
}
export function useBranchOverview(from: string, to: string) {
  return useQuery({
    queryKey: ["acct", "branches", from, to],
    queryFn: () => api.get<BranchRow[]>(`/accounting/branches?from=${from}&to=${to}`),
  });
}

export interface ConsolidatedPnl {
  from: string;
  to: string;
  branches: (ProfitLoss & { branchId: string; name: string })[];
  totals: ProfitLoss;
}

export function useConsolidatedPnl(from: string, to: string) {
  return useQuery({
    queryKey: ["acct", "pnl-consolidated", from, to],
    queryFn: () => api.get<ConsolidatedPnl>(`/accounting/profit-loss/consolidated?from=${from}&to=${to}`),
  });
}

export interface PeriodLockRow {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string | null;
  lockedAt: string;
}

export function usePeriodLocks(branchId: string | null) {
  return useQuery({
    queryKey: ["acct", "period-locks", branchId],
    queryFn: () => api.get<PeriodLockRow[]>(`/accounting/period-locks?${q(branchId)}`),
    enabled: !!branchId,
  });
}

export interface TillHistoryRow {
  id: string;
  openingFloat: string;
  expectedCash: string | null;
  countedCash: string | null;
  note: string | null;
  openedAt: string;
  closedAt: string | null;
  openedBy: { name: string };
  closedBy: { name: string } | null;
}

export function useTillHistory(branchId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["acct", "till-history", branchId, from, to],
    queryFn: () =>
      api.get<TillHistoryRow[]>(`/accounting/till-history?${q(branchId)}&from=${from}&to=${to}`),
    enabled: !!branchId,
  });
}

export interface LedgerAccountRow {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
}
export interface JournalRow {
  id: string;
  number: string;
  postedOn: string;
  narration: string;
  sourceType: string;
  lines: { debit: string; credit: string; account: { code: string; name: string } }[];
}

export function useLedgerAccounts(branchId: string | null) {
  return useQuery({
    queryKey: ["acct", "accounts", branchId],
    queryFn: () => api.get<LedgerAccountRow[]>(`/accounting/accounts?${q(branchId)}`),
    enabled: !!branchId,
  });
}
export function useAccountMaps(branchId: string | null) {
  return useQuery({
    queryKey: ["acct", "maps", branchId],
    queryFn: () =>
      api.get<{ id: string; sourceKey: string; account: { id: string; code: string; name: string } }[]>(
        `/accounting/account-maps?${q(branchId)}`,
      ),
    enabled: !!branchId,
  });
}
export function useJournals(branchId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["acct", "journals", branchId, from, to],
    queryFn: () => api.get<JournalRow[]>(`/accounting/journals?${q(branchId)}&from=${from}&to=${to}`),
    enabled: !!branchId,
  });
}
export function useTrialBalance(branchId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["acct", "tb", branchId, from, to],
    queryFn: () =>
      api.get<{
        rows: { code: string; name: string; type: string; debit: number; credit: number }[];
        totalDebit: number;
        totalCredit: number;
      }>(`/accounting/trial-balance?${q(branchId)}&from=${from}&to=${to}`),
    enabled: !!branchId,
  });
}
export function useTallyPosts(branchId: string | null) {
  return useQuery({
    queryKey: ["acct", "tally-posts", branchId],
    queryFn: () =>
      api.get<{ id: string; status: string; voucherCount: number; error: string | null; createdAt: string }[]>(
        `/accounting/tally/posts?${q(branchId)}`,
      ),
    enabled: !!branchId,
  });
}
export function useSyncStatus() {
  return useQuery({
    queryKey: ["acct", "sync"],
    queryFn: () =>
      api.get<{
        enabled: boolean;
        hqUrl: string | null;
        tokenConfigured: boolean;
        intervalSec: number;
        lastAt: string | null;
        lastError: string | null;
        hqEvents: number;
        branches: { id: string; name: string; pending: number }[];
      }>("/sync/status"),
  });
}
export function useHqEvents() {
  return useQuery({
    queryKey: ["acct", "hq"],
    queryFn: () =>
      api.get<{ id: string; sourceBranchName: string; entityType: string; entityId: string; receivedAt: string }[]>(
        "/sync/events",
      ),
  });
}

export function useAccountingActions(branchId: string | null) {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ["acct"] });
  return {
    addExpense: useMutation({
      mutationFn: (dto: {
        spentOn: string;
        category: string;
        amount: number;
        note?: string;
        vendor?: string;
        paidFromCash: boolean;
      }) => api.post(`/accounting/expenses?${q(branchId)}`, dto),
      onSuccess: done,
    }),
    updateExpense: useMutation({
      mutationFn: (v: {
        id: string;
        dto: {
          spentOn: string;
          category: string;
          amount: number;
          note?: string;
          vendor?: string;
          paidFromCash: boolean;
        };
      }) => api.patch(`/accounting/expenses/${v.id}?${q(branchId)}`, v.dto),
      onSuccess: done,
    }),
    deleteExpense: useMutation({
      mutationFn: (id: string) => api.delete(`/accounting/expenses/${id}?${q(branchId)}`),
      onSuccess: done,
    }),
    decideExpense: useMutation({
      mutationFn: (v: { id: string; status: "APPROVED" | "REJECTED" }) =>
        api.post(`/accounting/expenses/${v.id}/decision?${q(branchId)}`, { status: v.status }),
      onSuccess: done,
    }),
    addPettyCash: useMutation({
      mutationFn: (dto: { direction: "IN" | "OUT"; amount: number; reason: string; spentOn: string }) =>
        api.post(`/accounting/petty-cash?${q(branchId)}`, dto),
      onSuccess: done,
    }),
    deletePettyCash: useMutation({
      mutationFn: (id: string) => api.delete(`/accounting/petty-cash/${id}?${q(branchId)}`),
      onSuccess: done,
    }),
    updatePettyCash: useMutation({
      mutationFn: (v: {
        id: string;
        dto: { direction: "IN" | "OUT"; amount: number; reason: string; spentOn: string };
      }) => api.patch(`/accounting/petty-cash/${v.id}?${q(branchId)}`, v.dto),
      onSuccess: done,
    }),
    closeDay: useMutation({
      mutationFn: (dto: {
        businessDate: string;
        openingFloat: number;
        countedCash: number;
        bankDrop?: number;
        safeDrop?: number;
        note?: string;
      }) => api.post(`/accounting/closing?${q(branchId)}`, dto),
      onSuccess: done,
    }),
    reopenClosing: useMutation({
      mutationFn: (id: string) => api.post(`/accounting/closing/${id}/reopen?${q(branchId)}`, {}),
      onSuccess: done,
    }),
    adjustClosing: useMutation({
      mutationFn: (v: { id: string; countedCash?: number; note?: string }) =>
        api.patch(`/accounting/closing/${v.id}?${q(branchId)}`, {
          countedCash: v.countedCash,
          note: v.note,
        }),
      onSuccess: done,
    }),
    reverseJournal: useMutation({
      mutationFn: (id: string) => api.post(`/accounting/journals/${id}/reverse?${q(branchId)}`, {}),
      onSuccess: done,
    }),
    createAccount: useMutation({
      mutationFn: (dto: { code: string; name: string; type: string }) =>
        api.post(`/accounting/accounts?${q(branchId)}`, dto),
      onSuccess: done,
    }),
    seedDefaults: useMutation({
      mutationFn: () => api.post(`/accounting/accounts/seed-defaults?${q(branchId)}`, {}),
      onSuccess: done,
    }),
    createPeriodLock: useMutation({
      mutationFn: (dto: { fromDate: string; toDate: string; reason?: string }) =>
        api.post(`/accounting/period-locks?${q(branchId)}`, dto),
      onSuccess: done,
    }),
    deletePeriodLock: useMutation({
      mutationFn: (id: string) => api.delete(`/accounting/period-locks/${id}?${q(branchId)}`),
      onSuccess: done,
    }),
    updateAccount: useMutation({
      mutationFn: (v: { id: string; dto: { code?: string; name?: string; type?: string } }) =>
        api.patch(`/accounting/accounts/${v.id}?${q(branchId)}`, v.dto),
      onSuccess: done,
    }),
    deleteAccount: useMutation({
      mutationFn: (id: string) => api.delete(`/accounting/accounts/${id}?${q(branchId)}`),
      onSuccess: done,
    }),
    upsertMap: useMutation({
      mutationFn: (dto: { sourceKey: string; accountId: string }) =>
        api.post(`/accounting/account-maps?${q(branchId)}`, dto),
      onSuccess: done,
    }),
    deleteMap: useMutation({
      mutationFn: (id: string) => api.delete(`/accounting/account-maps/${id}?${q(branchId)}`),
      onSuccess: done,
    }),
    postJournal: useMutation({
      mutationFn: (dto: {
        postedOn: string;
        narration: string;
        lines: { accountId: string; debit: number; credit: number }[];
      }) => api.post(`/accounting/journals?${q(branchId)}`, dto),
      onSuccess: done,
    }),
    autoPost: useMutation({
      mutationFn: () => api.post(`/accounting/journals/auto-post?${q(branchId)}`, {}),
      onSuccess: done,
    }),
    pingTally: useMutation({
      mutationFn: () => api.post(`/accounting/tally/ping?${q(branchId)}`, {}),
    }),
    pushTally: useMutation({
      mutationFn: (dto: { from: string; to: string }) =>
        api.post(`/accounting/tally/push?${q(branchId)}`, dto),
      onSuccess: done,
    }),
    tickSync: useMutation({
      mutationFn: () => api.post("/sync/tick", {}),
      onSuccess: done,
    }),
  };
}
