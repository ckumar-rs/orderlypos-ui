"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Shift {
  id: string;
  userId: string;
  user: { id: string; name: string };
  startsAt: string;
  endsAt: string;
  note: string | null;
}
export interface LeaveRow {
  id: string;
  type: "ANNUAL" | "SICK" | "UNPAID" | "OTHER";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  startDate: string;
  endDate: string;
  reason: string | null;
  user?: { id: string; name: string };
}
export interface LeaveBalanceRow {
  userId: string;
  name: string;
  type: "ANNUAL" | "SICK";
  year: number;
  entitledDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  overridden: boolean;
}
export interface PayRow {
  userId: string;
  name: string;
  payType: "MONTHLY" | "HOURLY" | null;
  rate: number | null;
}
export interface PayrollRunRow {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: "DRAFT" | "FINALIZED";
  tipPool: string;
  totalNet: string;
}
export interface PayrollRunDetail extends PayrollRunRow {
  lines: {
    id: string;
    user: { id: string; name: string };
    hoursWorked: string;
    basePay: string;
    tipShare: string;
    unpaidLeaveDeduction: string;
    pfEmployee: string;
    pfEmployer: string;
    esiEmployee: string;
    esiEmployer: string;
    tds: string;
    netPay: string;
  }[];
}
export interface PerformanceRow {
  userId: string;
  name: string;
  orders: number;
  sales: number;
  tips: number;
  hoursWorked: number;
  salesPerHour: number | null;
}
export interface PerformanceReviewRow {
  id: string;
  userId: string;
  user: { id: string; name: string };
  periodStart: string;
  periodEnd: string;
  rating: number;
  note: string | null;
  createdBy: { id: string; name: string };
  createdAt: string;
}
export interface PerformancePayload {
  metrics: PerformanceRow[];
  reviews: PerformanceReviewRow[];
}

const q = (b: string | null) => `branchId=${b}`;

export function useShifts(branchId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["hr", "shifts", branchId, from, to],
    queryFn: () => api.get<Shift[]>(`/hr/shifts?${q(branchId)}&from=${from}&to=${to}`),
    enabled: !!branchId,
  });
}
export function useMyShifts(branchId: string | null) {
  return useQuery({
    queryKey: ["hr", "shifts", "mine", branchId],
    queryFn: () => api.get<Shift[]>(`/hr/shifts/mine?${q(branchId)}`),
    enabled: !!branchId,
  });
}
export function useLeave(branchId: string | null, status?: string) {
  return useQuery({
    queryKey: ["hr", "leave", branchId, status ?? "all"],
    queryFn: () =>
      api.get<LeaveRow[]>(
        `/hr/leave?${q(branchId)}${status ? `&status=${status}` : ""}`,
      ),
    enabled: !!branchId,
  });
}
export function useMyLeave() {
  return useQuery({ queryKey: ["hr", "leave", "mine"], queryFn: () => api.get<LeaveRow[]>("/hr/leave/mine") });
}
export function useLeaveBalances(branchId: string | null, year?: number) {
  return useQuery({
    queryKey: ["hr", "leave", "balances", branchId, year],
    queryFn: () =>
      api.get<LeaveBalanceRow[]>(
        `/hr/leave/balances?${q(branchId)}${year ? `&year=${year}` : ""}`,
      ),
    enabled: !!branchId,
  });
}
export function useMyLeaveBalances(branchId: string | null) {
  return useQuery({
    queryKey: ["hr", "leave", "balances", "mine", branchId],
    queryFn: () => api.get<LeaveBalanceRow[]>(`/hr/leave/balances/mine?${q(branchId)}`),
    enabled: !!branchId,
  });
}
export function usePay(branchId: string | null) {
  return useQuery({
    queryKey: ["hr", "pay", branchId],
    queryFn: () => api.get<PayRow[]>(`/hr/pay?${q(branchId)}`),
    enabled: !!branchId,
  });
}
export function usePayrollRuns(branchId: string | null) {
  return useQuery({
    queryKey: ["hr", "payroll", branchId],
    queryFn: () => api.get<PayrollRunRow[]>(`/hr/payroll?${q(branchId)}`),
    enabled: !!branchId,
  });
}
export function usePayrollRun(branchId: string | null, id: string | null) {
  return useQuery({
    queryKey: ["hr", "payroll", branchId, id],
    queryFn: () => api.get<PayrollRunDetail>(`/hr/payroll/${id}?${q(branchId)}`),
    enabled: !!branchId && !!id,
  });
}
export function usePerformance(branchId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["hr", "performance", branchId, from, to],
    queryFn: () =>
      api.get<PerformancePayload>(`/hr/performance?${q(branchId)}&from=${from}&to=${to}`),
    enabled: !!branchId,
  });
}

export function useHrActions(branchId: string | null) {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ["hr"] });
  return {
    addShift: useMutation({
      mutationFn: (dto: { userId: string; startsAt: string; endsAt: string; note?: string }) =>
        api.post(`/hr/shifts?${q(branchId)}`, dto),
      onSuccess: done,
    }),
    updateShift: useMutation({
      mutationFn: (v: { id: string; dto: { userId: string; startsAt: string; endsAt: string; note?: string } }) =>
        api.patch(`/hr/shifts/${v.id}?${q(branchId)}`, v.dto),
      onSuccess: done,
    }),
    deleteShift: useMutation({
      mutationFn: (id: string) => api.delete(`/hr/shifts/${id}?${q(branchId)}`),
      onSuccess: done,
    }),
    requestLeave: useMutation({
      mutationFn: (dto: { type: string; startDate: string; endDate: string; reason?: string }) =>
        api.post("/hr/leave", { ...dto, branchId }),
      onSuccess: done,
    }),
    createLeaveForStaff: useMutation({
      mutationFn: (dto: {
        userId: string;
        type: string;
        startDate: string;
        endDate: string;
        reason?: string;
        approveNow?: boolean;
      }) => api.post(`/hr/leave/for-staff?${q(branchId)}`, dto),
      onSuccess: done,
    }),
    decideLeave: useMutation({
      mutationFn: (v: { id: string; status: "APPROVED" | "REJECTED" }) =>
        api.patch(`/hr/leave/${v.id}?${q(branchId)}`, { status: v.status }),
      onSuccess: done,
    }),
    cancelLeave: useMutation({
      mutationFn: (id: string) => api.post(`/hr/leave/${id}/cancel?${q(branchId)}`),
      onSuccess: done,
    }),
    setLeaveBalance: useMutation({
      mutationFn: (dto: {
        userId: string;
        type: "ANNUAL" | "SICK";
        year: number;
        entitledDays: number;
      }) => api.put(`/hr/leave/balances?${q(branchId)}`, dto),
      onSuccess: done,
    }),
    setPay: useMutation({
      mutationFn: (v: { userId: string; payType: "MONTHLY" | "HOURLY"; rate: number }) =>
        api.put(`/hr/pay/${v.userId}?${q(branchId)}`, { payType: v.payType, rate: v.rate }),
      onSuccess: done,
    }),
    createRun: useMutation({
      mutationFn: (v: { periodStart: string; periodEnd: string }) => api.post(`/hr/payroll?${q(branchId)}`, v),
      onSuccess: done,
    }),
    finalizeRun: useMutation({
      mutationFn: (id: string) => api.post(`/hr/payroll/${id}/finalize?${q(branchId)}`),
      onSuccess: done,
    }),
    deleteRun: useMutation({
      mutationFn: (id: string) => api.delete(`/hr/payroll/${id}?${q(branchId)}`),
      onSuccess: done,
    }),
    downloadPayslip: useMutation({
      mutationFn: async (id: string) => {
        const file = await api.get<{ filename: string; csv: string }>(
          `/hr/payroll/${id}/payslip?${q(branchId)}`,
        );
        const blob = new Blob([file.csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.filename;
        a.click();
        URL.revokeObjectURL(url);
        return file;
      },
    }),
    createReview: useMutation({
      mutationFn: (dto: {
        userId: string;
        periodStart: string;
        periodEnd: string;
        rating: number;
        note?: string;
      }) => api.post(`/hr/performance/reviews?${q(branchId)}`, dto),
      onSuccess: done,
    }),
    deleteReview: useMutation({
      mutationFn: (id: string) => api.delete(`/hr/performance/reviews/${id}?${q(branchId)}`),
      onSuccess: done,
    }),
  };
}
