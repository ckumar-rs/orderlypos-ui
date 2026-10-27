"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ExpenseRow {
  id: string;
  spentOn: string;
  category: string;
  amount: string;
  note: string | null;
  paidFromCash: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
}
export interface ClosingPreview {
  businessDate: string;
  openingFloat: number;
  cashSales: number;
  cashExpenses: number;
  expectedCash: number;
}
export interface ClosingRow {
  id: string;
  businessDate: string;
  expectedCash: string;
  countedCash: string;
  variance: string;
  note: string | null;
}
export interface ProfitLoss {
  orders: number;
  grossCollected: number;
  taxCollected: number;
  refunds: number;
  netSales: number;
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
export function useClosingPreview(branchId: string | null, date: string, openingFloat: number) {
  return useQuery({
    queryKey: ["acct", "preview", branchId, date, openingFloat],
    queryFn: () =>
      api.get<ClosingPreview>(`/accounting/closing/preview?${q(branchId)}&date=${date}&openingFloat=${openingFloat}`),
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
export function useBranchOverview(from: string, to: string) {
  return useQuery({
    queryKey: ["acct", "branches", from, to],
    queryFn: () => api.get<BranchRow[]>(`/accounting/branches?from=${from}&to=${to}`),
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
      api.get<{ id: string; sourceKey: string; account: { code: string; name: string } }[]>(
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
      mutationFn: (dto: { spentOn: string; category: string; amount: number; note?: string; paidFromCash: boolean }) =>
        api.post(`/accounting/expenses?${q(branchId)}`, dto),
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
    closeDay: useMutation({
      mutationFn: (dto: { businessDate: string; openingFloat: number; countedCash: number; note?: string }) =>
        api.post(`/accounting/closing?${q(branchId)}`, dto),
      onSuccess: done,
    }),
    createAccount: useMutation({
      mutationFn: (dto: { code: string; name: string; type: string }) =>
        api.post(`/accounting/accounts?${q(branchId)}`, dto),
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
