"use client";

import { KOT_NEXT_STATUS, type KotStatusDto } from "@nodedr-restaurant/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { applyQueuedStatuses } from "@/lib/kds-offline";
import { enqueueRequest, readQueue } from "@/lib/offline-queue";

export interface KotTicket {
  id: string;
  orderId: string;
  stationId: string | null;
  ticketNumber: string;
  status: KotStatusDto;
  held: boolean;
  firedAt: string | null;
  expoAssembledAt: string | null;
  isPriority: boolean;
  printedCount: number;
  lastPrintError: string | null;
  createdAt: string;
  station: { id: string; name: string; role?: string } | null;
  course: { id: string; name: string } | null;
  order: {
    orderNumber: string;
    type: string;
    channel: "STAFF" | "ONLINE";
    notes: string | null;
    foodPlatform?: "ZOMATO" | "SWIGGY" | null;
    externalOrderId?: string | null;
    table: { number: string; name: string | null } | null;
    guestName: string | null;
    customer: { name: string | null; phone: string | null } | null;
  };
  items: {
    id: string;
    status: string;
    delayReason: string | null;
    orderItem: {
      nameSnapshot: string;
      quantity: number;
      kitchenNote: string | null;
      modifiers: { nameSnapshot: string }[];
      menuItem?: { prepTimeMinutes: number | null } | null;
    };
  }[];
}

export function useKdsStations(branchId: string | null) {
  return useQuery({
    queryKey: ["kds", "stations", branchId],
    queryFn: () =>
      api.get<{ id: string; name: string; role?: string }[]>(`/kds/stations?branchId=${branchId}`),
    enabled: !!branchId,
    staleTime: 60_000,
  });
}

function boardKey(branchId: string, stationId: string) {
  return `kds-board:${branchId}:${stationId}`;
}

function readBoard(branchId: string, stationId: string): KotTicket[] | null {
  try {
    const raw = localStorage.getItem(boardKey(branchId, stationId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KotTicket[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** stationId "" = every station (the default, and what this screen always did). */
export function useKdsTickets(branchId: string | null, stationId = "", enabled = true) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["kds", "tickets", branchId, stationId],
    queryFn: async () => {
      if (!branchId) return [];
      try {
        let rows = await api.get<KotTicket[]>(
          `/kds/tickets?branchId=${branchId}${stationId ? `&stationId=${encodeURIComponent(stationId)}` : ""}`,
        );
        rows = applyQueuedStatuses(rows, readQueue(`kds-queue:${branchId}`));
        localStorage.setItem(boardKey(branchId, stationId), JSON.stringify(rows));
        queryClient.setQueryData(["kds", "serving-copy", branchId, stationId], false);
        return rows;
      } catch (err) {
        if (err instanceof ApiError) throw err;
        const copy = readBoard(branchId, stationId);
        if (!copy) throw err;
        queryClient.setQueryData(["kds", "serving-copy", branchId, stationId], true);
        return applyQueuedStatuses(copy, readQueue(`kds-queue:${branchId}`));
      }
    },
    enabled: !!branchId && enabled,
    refetchInterval: 20_000,
  });
}

export function useKdsServingCopy(branchId: string | null, stationId = "") {
  return useQuery({
    queryKey: ["kds", "serving-copy", branchId, stationId],
    queryFn: () => false,
    enabled: false,
    initialData: false,
  });
}

export function useUpdateKotStatus(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: KotStatusDto;
    }): Promise<{ offline: true; id: string; status: KotStatusDto } | { offline: false }> => {
      try {
        await api.patch(`/kds/tickets/${id}/status?branchId=${branchId}`, { status });
        return { offline: false };
      } catch (err) {
        if (err instanceof ApiError || !branchId) throw err;
        const queueKey = `kds-queue:${branchId}`;
        const itemId = `${id}:${status}`;
        if (!readQueue(queueKey).some((item) => item.id === itemId)) {
          enqueueRequest(queueKey, {
            id: itemId,
            path: `/kds/tickets/${id}/status?branchId=${branchId}`,
            body: { status },
            createdAt: new Date().toISOString(),
          });
        }
        return { offline: true, id, status };
      }
    },
    onSuccess: (result) => {
      if (!branchId || !result.offline) return;
      const entries = queryClient.getQueriesData<KotTicket[]>({ queryKey: ["kds", "tickets", branchId] });
      for (const [key, rows] of entries) {
        if (!rows) continue;
        const next = rows.map((ticket) =>
          ticket.id === result.id ? { ...ticket, status: result.status } : ticket,
        );
        queryClient.setQueryData(key, next);
        const station = String(key[3] ?? "");
        localStorage.setItem(boardKey(branchId, station), JSON.stringify(next));
        queryClient.setQueryData(["kds", "serving-copy", branchId, station], true);
      }
    },
    // Also on error: a 409 means the ticket moved on another screen, and the
    // board must show where it really is rather than the stale step.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["kds", "tickets"] }),
  });
}

export const NEXT_STATUS = KOT_NEXT_STATUS;

/** The kitchen declining a ticket; `confirmStarted` once cooking has begun. */
export function useRejectKot(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, confirmStarted }: { id: string; reason: string; confirmStarted?: boolean }) =>
      api.post(`/kds/tickets/${id}/reject?branchId=${branchId}`, { reason, confirmStarted }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["kds"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["floors", branchId] });
    },
  });
}

export interface IncomingOrder {
  id: string;
  orderNumber: string;
  type: string;
  channel: "STAFF" | "ONLINE";
  guestName: string | null;
  notes: string | null;
  createdAt: string;
  scheduledFor: string | null;
  table: { number: string; name: string | null } | null;
  customer: { name: string | null; phone: string | null } | null;
  items: {
    id: string;
    nameSnapshot: string;
    quantity: number;
    kitchenNote: string | null;
    modifiers: { nameSnapshot: string }[];
  }[];
}

/** Orders waiting for a yes/no. Only fetched for users who may answer them. */
export function useKdsIncoming(branchId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["kds", "incoming", branchId],
    queryFn: () => api.get<IncomingOrder[]>(`/kds/incoming?branchId=${branchId}`),
    enabled: !!branchId && enabled,
    refetchInterval: 15_000,
  });
}

function invalidateAfterAnswer(queryClient: ReturnType<typeof useQueryClient>, branchId: string | null) {
  queryClient.invalidateQueries({ queryKey: ["kds"] });
  queryClient.invalidateQueries({ queryKey: ["orders"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["floors", branchId] });
}

export function useAcceptIncoming(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.post(`/kds/incoming/${orderId}/accept?branchId=${branchId}`),
    onSettled: () => invalidateAfterAnswer(queryClient, branchId),
  });
}

export function useDeclineIncoming(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      api.post(`/kds/incoming/${orderId}/reject?branchId=${branchId}`, { reason }),
    onSettled: () => invalidateAfterAnswer(queryClient, branchId),
  });
}

export interface KitchenProgressTicket {
  id: string;
  orderId: string;
  status: KotStatusDto;
  createdAt: string;
  readyAt: string | null;
  order: {
    orderNumber: string;
    type: string;
    table: { id: string; number: string; name: string | null } | null;
  };
}

/** Where each live ticket is - for order-taking screens, no guest details. */
export function useKdsProgress(branchId: string | null) {
  return useQuery({
    queryKey: ["kds", "progress", branchId],
    queryFn: () => api.get<KitchenProgressTicket[]>(`/kds/progress?branchId=${branchId}`),
    enabled: !!branchId,
    refetchInterval: 20_000,
  });
}

export function useSetKotPriority(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPriority }: { id: string; isPriority: boolean }) =>
      api.patch(`/kds/tickets/${id}/priority?branchId=${branchId}`, { isPriority }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kds", "tickets", branchId] }),
  });
}

/** `reprint` false = first print (409 if already printed); true = extra copy stamped REPRINT. */
export function useReprintKot(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reprint }: { id: string; reprint: boolean }) =>
      api.post(`/kds/tickets/${id}/${reprint ? "reprint" : "print"}?branchId=${branchId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kds", "tickets", branchId] }),
  });
}

export interface KitchenPerformanceRow {
  stationId: string;
  stationName: string;
  ticketsReady: number;
  avgMinutesToReady: number | null;
  delayRate: number | null;
  throughputPerHour: number;
  slaCompliance: number | null;
}

export function useUpdateKotItemStatus(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      delayReason,
    }: {
      id: string;
      status: "ACCEPTED" | "PREPARING" | "READY" | "SERVED" | "DELAYED";
      delayReason?: string;
    }) => api.patch(`/kds/items/${id}/status?branchId=${branchId}`, { status, delayReason }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["kds"] }),
  });
}

export function useSetKotHeld(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, held }: { id: string; held: boolean }) =>
      api.patch(`/kds/tickets/${id}/hold?branchId=${branchId}`, { held }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["kds"] }),
  });
}

export interface ExpoOrder {
  orderId: string;
  orderNumber: string;
  type: string;
  table: { number: string; name: string | null } | null;
  guestName: string | null;
  allReady: boolean;
  assembled: boolean;
  kots: KotTicket[];
}

export function useKdsExpo(branchId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["kds", "expo", branchId],
    queryFn: () => api.get<ExpoOrder[]>(`/kds/expo?branchId=${branchId}`),
    enabled: !!branchId && enabled,
    refetchInterval: 10_000,
  });
}

export function useAssembleExpo(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.post(`/kds/expo/${orderId}/assemble?branchId=${branchId}`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["kds"] }),
  });
}

export function useFireCourse(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, courseId }: { orderId: string; courseId: string }) =>
      api.post(`/kds/expo/${orderId}/fire?branchId=${branchId}`, { courseId }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["kds"] }),
  });
}

export function usePassExpo(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.post(`/kds/expo/${orderId}/pass?branchId=${branchId}`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["kds"] }),
  });
}

export function useKitchenPerformance(branchId: string | null, date?: string) {
  return useQuery({
    queryKey: ["kds", "performance", branchId, date ?? "today"],
    queryFn: () =>
      api.get<KitchenPerformanceRow[]>(
        `/kds/performance?branchId=${branchId}${date ? `&date=${date}` : ""}`,
      ),
    enabled: !!branchId,
    refetchInterval: 60_000,
  });
}
