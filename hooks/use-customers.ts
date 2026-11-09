"use client";

import type { CustomerDto } from "@nodedr-restaurant/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Customer {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  birthday: string | null;
  anniversary: string | null;
  allergies: string | null;
  notes: string | null;
  marketingOptOut?: boolean;
  loyaltyPoints: number;
  walletBalance: string;
  referralCode?: string | null;
  gstStateCode?: string | null;
  tier?: { id: string; name: string; earnMultiplier: string } | null;
  rfmRecency?: number | null;
  rfmFrequency?: number | null;
  rfmMonetary?: number | null;
  rfmScore?: string | null;
  rfmSegment?: string | null;
  clvEstimate?: string | number;
  rfmComputedAt?: string | null;
  createdAt: string;
}

export interface CustomerDetail extends Customer {
  cashbackBalance?: string;
  orders: { id: string; orderNumber: string; totalAmount: string; billedAt: string }[];
  giftCards: { id: string; code: string; balance: string; initialValue: string }[];
  favorites?: { menuItemId: string; name: string; quantity: number }[];
  recommendations?: { menuItemId: string; name: string; reason: string }[];
  metrics?: {
    visits: number;
    spend: number;
    aov: number;
    averageDaysBetween: number | null;
    visitsPer30Days: number | null;
  };
  rewards?: { id: string; name: string; pointsCost: number; cashbackCost: string }[];
}

export function useCustomers(branchId: string | null, search?: string) {
  return useQuery({
    queryKey: ["customers", branchId, search],
    queryFn: () =>
      api.get<Customer[]>(`/customers?branchId=${branchId}${search ? `&search=${search}` : ""}`),
    enabled: !!branchId,
  });
}

export function useCustomer(branchId: string | null, id: string | null) {
  return useQuery({
    queryKey: ["customers", branchId, "detail", id],
    queryFn: () => api.get<CustomerDetail>(`/customers/${id}?branchId=${branchId}`),
    enabled: !!branchId && !!id,
  });
}

export function useCreateCustomer(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CustomerDto) => api.post<Customer>(`/customers?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers", branchId] }),
  });
}

export function useFindOrCreateCustomer(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { phone: string; name?: string }) =>
      api.post<{ customer: Customer; created: boolean }>(
        `/customers/find-or-create?branchId=${branchId}`,
        dto,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers", branchId] }),
  });
}

export type CustomerImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
};

export function useImportCustomers(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (csv: string) =>
      api.post<CustomerImportResult>(`/customers/import?branchId=${branchId}`, { csv }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", branchId] });
    },
  });
}

export function useUpdateCustomer(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CustomerDto> }) =>
      api.patch<Customer>(`/customers/${id}?branchId=${branchId}`, dto),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["customers", branchId] });
      queryClient.invalidateQueries({ queryKey: ["customers", branchId, "detail", id] });
    },
  });
}

export function useDeleteCustomer(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}?branchId=${branchId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers", branchId] }),
  });
}

export type TimelineEvent = {
  id: string;
  kind: string;
  at: string;
  title: string;
  detail?: string | null;
  meta?: Record<string, unknown>;
};

export type CustomerFollowUp = {
  id: string;
  title: string;
  body: string | null;
  dueAt: string | null;
  doneAt: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string } | null;
  completedBy?: { id: string; name: string } | null;
};

export function useCustomerTimeline(branchId: string | null, customerId: string | null) {
  return useQuery({
    queryKey: ["customers", branchId, "timeline", customerId],
    queryFn: () =>
      api.get<{ events: TimelineEvent[] }>(
        `/customers/${customerId}/timeline?branchId=${branchId}`,
      ),
    enabled: !!branchId && !!customerId,
  });
}

export function useCustomerFollowUps(branchId: string | null, customerId: string | null) {
  return useQuery({
    queryKey: ["customers", branchId, "follow-ups", customerId],
    queryFn: () =>
      api.get<CustomerFollowUp[]>(`/customers/${customerId}/follow-ups?branchId=${branchId}`),
    enabled: !!branchId && !!customerId,
  });
}

export function useDueFollowUps(branchId: string | null) {
  return useQuery({
    queryKey: ["customers", branchId, "follow-ups-due"],
    queryFn: () =>
      api.get<
        (CustomerFollowUp & {
          customer: { id: string; name: string | null; phone: string | null };
        })[]
      >(`/customers/follow-ups/due?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

function invalidateCrm(qc: ReturnType<typeof useQueryClient>, branchId: string | null, id: string) {
  qc.invalidateQueries({ queryKey: ["customers", branchId, "timeline", id] });
  qc.invalidateQueries({ queryKey: ["customers", branchId, "follow-ups", id] });
  qc.invalidateQueries({ queryKey: ["customers", branchId, "follow-ups-due"] });
}

export function useAddCustomerNote(branchId: string | null, customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { body: string }) =>
      api.post(`/customers/${customerId}/notes?branchId=${branchId}`, dto),
    onSuccess: () => invalidateCrm(qc, branchId, customerId),
  });
}

export function useCreateFollowUp(branchId: string | null, customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { title: string; body?: string | null; dueAt?: Date | null }) =>
      api.post(`/customers/${customerId}/follow-ups?branchId=${branchId}`, {
        title: dto.title,
        body: dto.body ?? null,
        dueAt: dto.dueAt ? dto.dueAt.toISOString() : null,
      }),
    onSuccess: () => invalidateCrm(qc, branchId, customerId),
  });
}

export function useCompleteFollowUp(branchId: string | null, customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (followUpId: string) =>
      api.post(
        `/customers/${customerId}/follow-ups/${followUpId}/complete?branchId=${branchId}`,
        {},
      ),
    onSuccess: () => invalidateCrm(qc, branchId, customerId),
  });
}

export function useReopenFollowUp(branchId: string | null, customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (followUpId: string) =>
      api.post(
        `/customers/${customerId}/follow-ups/${followUpId}/reopen?branchId=${branchId}`,
        {},
      ),
    onSuccess: () => invalidateCrm(qc, branchId, customerId),
  });
}
