"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CouponRow {
  id: string;
  code: string;
  kind: "PERCENT" | "FLAT";
  value: string;
  minOrderAmount: string;
  maxDiscount: string | null;
  validUntil: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
}
export interface PromotionRow {
  id: string;
  name: string;
  kind: "PERCENT" | "FLAT" | "BOGO";
  value: string;
  buyQuantity?: number | null;
  getQuantity?: number | null;
  audience?: "ALL" | "STAFF";
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  isActive: boolean;
  categoryId?: string | null;
  minOrderAmount?: string | number | null;
  customerId?: string | null;
  weatherCode?: string | null;
  bundleMenuItemId?: string | null;
  allDay?: boolean;
}
export interface CampaignRow {
  id: string;
  name: string;
  channel: "SMS" | "EMAIL" | "WHATSAPP";
  segment: "ALL" | "LOYAL" | "LAPSED" | "BIRTHDAY_MONTH" | "TIER" | "RFM";
  tierId?: string | null;
  rfmLabel?: string | null;
  message: string;
  lastSentAt: string | null;
  lastSentCount: number | null;
}

const q = (b: string | null) => `branchId=${b}`;

export function useCoupons(branchId: string | null) {
  return useQuery({ queryKey: ["marketing", "coupons", branchId], queryFn: () => api.get<CouponRow[]>(`/marketing/coupons?${q(branchId)}`), enabled: !!branchId });
}
export function usePromotions(branchId: string | null) {
  return useQuery({ queryKey: ["marketing", "promotions", branchId], queryFn: () => api.get<PromotionRow[]>(`/marketing/promotions?${q(branchId)}`), enabled: !!branchId });
}
export function useCampaigns(branchId: string | null) {
  return useQuery({ queryKey: ["marketing", "campaigns", branchId], queryFn: () => api.get<CampaignRow[]>(`/marketing/campaigns?${q(branchId)}`), enabled: !!branchId });
}
export function useAudience(branchId: string | null, id: string | null) {
  return useQuery({
    queryKey: ["marketing", "audience", branchId, id],
    queryFn: () => api.get<{ count: number }>(`/marketing/campaigns/${id}/audience?${q(branchId)}`),
    enabled: !!branchId && !!id,
  });
}

export type CampaignReportCounts = {
  QUEUED: number;
  SENT: number;
  DELIVERED: number;
  READ: number;
  FAILED: number;
  OPTED_OUT: number;
  total: number;
};

export type CampaignReportMessage = {
  id: string;
  to: string;
  status: string;
  provider: string | null;
  providerRef: string | null;
  error: string | null;
  attempts: number;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  campaignBatchId: string | null;
};

export type CampaignReport = {
  campaign: {
    id: string;
    name: string;
    channel: string;
    segment: string;
    message: string;
    lastSentAt: string | null;
    lastSentCount: number | null;
  };
  batchId: string | null;
  batch: CampaignReportCounts;
  overall: CampaignReportCounts;
  batches: { id: string; createdAt: string }[];
  messages: CampaignReportMessage[];
};

export function useCampaignReport(
  branchId: string | null,
  campaignId: string | null,
  batchId?: string | null,
  status?: string | null,
) {
  const params = new URLSearchParams();
  if (branchId) params.set("branchId", branchId);
  if (batchId) params.set("batchId", batchId);
  if (status) params.set("status", status);
  params.set("take", "200");
  return useQuery({
    queryKey: ["marketing", "campaign-report", branchId, campaignId, batchId, status],
    queryFn: () =>
      api.get<CampaignReport>(`/marketing/campaigns/${campaignId}/report?${params}`),
    enabled: !!branchId && !!campaignId,
    refetchInterval: 15_000,
  });
}

export function useMarketingActions(branchId: string | null) {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ["marketing"] });
  return {
    createCoupon: useMutation({ mutationFn: (dto: Record<string, unknown>) => api.post(`/marketing/coupons?${q(branchId)}`, dto), onSuccess: done }),
    updateCoupon: useMutation({ mutationFn: (v: { id: string; dto: Record<string, unknown> }) => api.patch(`/marketing/coupons/${v.id}?${q(branchId)}`, v.dto), onSuccess: done }),
    couponActive: useMutation({ mutationFn: (v: { id: string; isActive: boolean }) => api.patch(`/marketing/coupons/${v.id}/active?${q(branchId)}`, { isActive: v.isActive }), onSuccess: done }),
    deleteCoupon: useMutation({ mutationFn: (id: string) => api.delete(`/marketing/coupons/${id}?${q(branchId)}`), onSuccess: done }),
    createPromotion: useMutation({ mutationFn: (dto: Record<string, unknown>) => api.post(`/marketing/promotions?${q(branchId)}`, dto), onSuccess: done }),
    updatePromotion: useMutation({ mutationFn: (v: { id: string; dto: Record<string, unknown> }) => api.patch(`/marketing/promotions/${v.id}?${q(branchId)}`, v.dto), onSuccess: done }),
    promotionActive: useMutation({ mutationFn: (v: { id: string; isActive: boolean }) => api.patch(`/marketing/promotions/${v.id}/active?${q(branchId)}`, { isActive: v.isActive }), onSuccess: done }),
    deletePromotion: useMutation({ mutationFn: (id: string) => api.delete(`/marketing/promotions/${id}?${q(branchId)}`), onSuccess: done }),
    createCampaign: useMutation({ mutationFn: (dto: Record<string, unknown>) => api.post(`/marketing/campaigns?${q(branchId)}`, dto), onSuccess: done }),
    updateCampaign: useMutation({ mutationFn: (v: { id: string; dto: Record<string, unknown> }) => api.patch(`/marketing/campaigns/${v.id}?${q(branchId)}`, v.dto), onSuccess: done }),
    sendCampaign: useMutation({ mutationFn: (id: string) => api.post<{ sent: number; failed: number }>(`/marketing/campaigns/${id}/send?${q(branchId)}`), onSuccess: done }),
    deleteCampaign: useMutation({ mutationFn: (id: string) => api.delete(`/marketing/campaigns/${id}?${q(branchId)}`), onSuccess: done }),
  };
}

export interface EquipmentRow {
  id: string;
  name: string;
  location: string | null;
  serviceIntervalDays: number | null;
  lastServicedAt: string | null;
  nextDueAt: string | null;
  overdue: boolean;
  dueSoon: boolean;
}
export interface DocumentRow {
  id: string;
  title: string;
  category: "SOP" | "CONTRACT" | "RECIPE" | "PURCHASE" | "OTHER";
  updatedAt: string;
}
export interface DocumentFull extends DocumentRow {
  body: string;
  files?: { id: string; fileName: string; mimeType: string; size: number }[];
}

export function useEquipment(branchId: string | null) {
  return useQuery({ queryKey: ["ops", "equipment", branchId], queryFn: () => api.get<EquipmentRow[]>(`/operations/equipment?${q(branchId)}`), enabled: !!branchId });
}
export function useDocuments(branchId: string | null) {
  return useQuery({ queryKey: ["ops", "documents", branchId], queryFn: () => api.get<DocumentRow[]>(`/operations/documents?${q(branchId)}`), enabled: !!branchId });
}
export function useDocument(branchId: string | null, id: string | null) {
  return useQuery({ queryKey: ["ops", "document", branchId, id], queryFn: () => api.get<DocumentFull>(`/operations/documents/${id}?${q(branchId)}`), enabled: !!branchId && !!id });
}

export function useOpsActions(branchId: string | null) {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ["ops"] });
  return {
    createEquipment: useMutation({ mutationFn: (dto: Record<string, unknown>) => api.post(`/operations/equipment?${q(branchId)}`, dto), onSuccess: done }),
    updateEquipment: useMutation({ mutationFn: (v: { id: string; dto: Record<string, unknown> }) => api.patch(`/operations/equipment/${v.id}?${q(branchId)}`, v.dto), onSuccess: done }),
    retireEquipment: useMutation({ mutationFn: (id: string) => api.delete(`/operations/equipment/${id}?${q(branchId)}`), onSuccess: done }),
    logService: useMutation({ mutationFn: (v: { id: string; servicedAt: string; cost?: number; note?: string }) => api.post(`/operations/equipment/${v.id}/logs?${q(branchId)}`, { servicedAt: v.servicedAt, cost: v.cost, note: v.note }), onSuccess: done }),
    createDocument: useMutation({ mutationFn: (dto: Record<string, unknown>) => api.post(`/operations/documents?${q(branchId)}`, dto), onSuccess: done }),
    updateDocument: useMutation({ mutationFn: (v: { id: string; dto: Record<string, unknown> }) => api.patch(`/operations/documents/${v.id}?${q(branchId)}`, v.dto), onSuccess: done }),
    deleteDocument: useMutation({ mutationFn: (id: string) => api.delete(`/operations/documents/${id}?${q(branchId)}`), onSuccess: done }),
  };
}
