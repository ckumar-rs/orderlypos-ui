"use client";

import type {
  MenuCategoryDto,
  MenuItemDto,
  MenuSetDto,
  ModifierGroupDto,
  SalesChannelDto,
} from "@nodedr-restaurant/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  showOnWebsite: boolean;
  parentId?: string | null;
  _count: { items: number };
}

export interface SalesChannel {
  id: string;
  name: string;
  orderType: string | null;
  foodPlatform: string | null;
  markupPercent: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface MenuSet {
  id: string;
  name: string;
  isActive: boolean;
  isForced: boolean;
  daysOfWeek: number[];
  startTime: string | null;
  endTime: string | null;
  startsOn?: string | null;
  endsOn?: string | null;
  menuItemIds: string[];
}

export interface KitchenStation {
  id: string;
  name: string;
  role?: string;
}

export interface KitchenCourse {
  id: string;
  name: string;
  sortOrder: number;
  holdByDefault: boolean;
}

export interface Modifier {
  id: string;
  name: string;
  imageUrl?: string | null;
  priceAdjustment: string;
  isDefault: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  modifiers: Modifier[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  stationId: string | null;
  courseId?: string | null;
  course?: { id: string; name: string } | null;
  name: string;
  sku?: string | null;
  prepTimeMinutes?: number | null;
  isJain?: boolean;
  isGlutenFree?: boolean;
  imageUrl: string | null;
  price: string;
  halfPrice: string | null;
  taxRatePercent: string;
  isVeg: boolean;
  isVegan?: boolean;
  spiceLevel?: string;
  isActive: boolean;
  isCombo: boolean;
  barcode: string | null;
  hsnCode: string | null;
  soldByWeight: boolean;
  sizes?: { id: string; name: string; price: string }[];
  channelPrices?: { channelId: string; price: string }[];
  category: { id: string; name: string };
  station: { id: string; name: string } | null;
  modifierGroups: { modifierGroup: ModifierGroup }[];
}

export function useCategories(branchId: string | null) {
  return useQuery({
    queryKey: ["menu", "categories", branchId],
    queryFn: () => api.get<MenuCategory[]>(`/menu/categories?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

export function useStations(branchId: string | null) {
  return useQuery({
    queryKey: ["menu", "stations", branchId],
    queryFn: () => api.get<KitchenStation[]>(`/menu/stations?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

export function useMenuItems(branchId: string | null, categoryId?: string) {
  return useQuery({
    queryKey: ["menu", "items", branchId, categoryId],
    queryFn: async () => {
      try {
        const rows = await api.get<MenuItem[]>(
          `/menu/items?branchId=${branchId}${categoryId ? `&categoryId=${categoryId}` : ""}`,
        );
        if (typeof window !== "undefined" && branchId && !categoryId) {
          window.localStorage.setItem(`pos-menu:${branchId}`, JSON.stringify(rows));
        }
        return rows;
      } catch (error) {
        if (error instanceof ApiError || typeof window === "undefined" || categoryId || !branchId) throw error;
        const cached = window.localStorage.getItem(`pos-menu:${branchId}`);
        if (!cached) throw error;
        return JSON.parse(cached) as MenuItem[];
      }
    },
    enabled: !!branchId,
  });
}

export function useCreateCategory(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: MenuCategoryDto) =>
      api.post(`/menu/categories?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu", "categories", branchId] }),
  });
}

export function useUpdateCategory(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<MenuCategoryDto> }) =>
      api.patch(`/menu/categories/${id}?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu", "categories", branchId] }),
  });
}

export function useDeleteCategory(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/menu/categories/${id}?branchId=${branchId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", "categories", branchId] });
      queryClient.invalidateQueries({ queryKey: ["menu", "items", branchId] });
    },
  });
}

export function useUploadItemImage() {
  return useMutation({
    mutationFn: (file: File) => api.upload<{ url: string }>("/menu/items/upload-image", file),
  });
}

export function useCreateMenuItem(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: MenuItemDto) => api.post(`/menu/items?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu", "items", branchId] }),
  });
}

export function useUpdateMenuItem(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<MenuItemDto> }) =>
      api.patch(`/menu/items/${id}?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu", "items", branchId] }),
  });
}

export function useModifierGroups(branchId: string | null) {
  return useQuery({
    queryKey: ["menu", "modifier-groups", branchId],
    queryFn: () => api.get<ModifierGroup[]>(`/menu/modifier-groups?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

export function useCreateModifierGroup(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ModifierGroupDto) =>
      api.post(`/menu/modifier-groups?branchId=${branchId}`, dto),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["menu", "modifier-groups", branchId] }),
  });
}

export function useUpdateModifierImage(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, imageUrl }: { id: string; imageUrl: string | null }) =>
      api.patch(`/menu/modifiers/${id}?branchId=${branchId}`, { imageUrl }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["menu", "modifier-groups", branchId] }),
  });
}

export function useDeleteModifierGroup(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/menu/modifier-groups/${id}?branchId=${branchId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", "modifier-groups", branchId] });
      queryClient.invalidateQueries({ queryKey: ["menu", "items", branchId] });
    },
  });
}

export function useSalesChannels(branchId: string | null) {
  return useQuery({
    queryKey: ["menu", "channels", branchId],
    queryFn: () => api.get<SalesChannel[]>(`/menu/channels?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

export function useMenuSets(branchId: string | null) {
  return useQuery({
    queryKey: ["menu", "sets", branchId],
    queryFn: () => api.get<MenuSet[]>(`/menu/sets?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

export function useMenuRuleActions(branchId: string | null) {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["menu", branchId] });
    queryClient.invalidateQueries({ queryKey: ["menu", "channels", branchId] });
    queryClient.invalidateQueries({ queryKey: ["menu", "sets", branchId] });
    queryClient.invalidateQueries({ queryKey: ["menu", "items", branchId] });
    queryClient.invalidateQueries({ queryKey: ["menu", "categories", branchId] });
  };
  return {
    createChannel: useMutation({
      mutationFn: (dto: SalesChannelDto) => api.post(`/menu/channels?branchId=${branchId}`, dto),
      onSuccess: refresh,
    }),
    updateChannel: useMutation({
      mutationFn: ({ id, dto }: { id: string; dto: Partial<SalesChannelDto> }) =>
        api.patch(`/menu/channels/${id}?branchId=${branchId}`, dto),
      onSuccess: refresh,
    }),
    deleteChannel: useMutation({
      mutationFn: (id: string) => api.delete(`/menu/channels/${id}?branchId=${branchId}`),
      onSuccess: refresh,
    }),
    createSet: useMutation({
      mutationFn: (dto: MenuSetDto) => api.post(`/menu/sets?branchId=${branchId}`, dto),
      onSuccess: refresh,
    }),
    updateSet: useMutation({
      mutationFn: ({ id, dto }: { id: string; dto: Partial<MenuSetDto> }) =>
        api.patch(`/menu/sets/${id}?branchId=${branchId}`, dto),
      onSuccess: refresh,
    }),
    deleteSet: useMutation({
      mutationFn: (id: string) => api.delete(`/menu/sets/${id}?branchId=${branchId}`),
      onSuccess: refresh,
    }),
    setItemChannelPrices: useMutation({
      mutationFn: ({ id, prices }: { id: string; prices: { channelId: string; price: number }[] }) =>
        api.post(`/menu/items/${id}/channel-prices?branchId=${branchId}`, { prices }),
      onSuccess: refresh,
    }),
  };
}

export function flattenCategories(categories: MenuCategory[]) {
  const byParent = new Map<string | null, MenuCategory[]>();
  for (const category of categories) {
    const key = category.parentId ?? null;
    const bucket = byParent.get(key) ?? [];
    bucket.push(category);
    byParent.set(key, bucket);
  }
  const ids = new Set(categories.map((c) => c.id));
  const out: (MenuCategory & { depth: number })[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const category of byParent.get(parentId) ?? []) {
      out.push({ ...category, depth });
      walk(category.id, depth + 1);
    }
  };
  walk(null, 0);
  for (const category of categories) {
    if (category.parentId && !ids.has(category.parentId) && !out.some((row) => row.id === category.id)) {
      out.push({ ...category, depth: 0 });
    }
  }
  return out;
}

export function useDeleteMenuItem(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/menu/items/${id}?branchId=${branchId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu", "items", branchId] }),
  });
}
