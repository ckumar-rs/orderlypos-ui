"use client";

import type {
  GoodsReceiptDto,
  IngredientDto,
  IngredientUnit,
  PurchaseOrderDto,
  PurchaseOrderStatus,
  PurchaseRequestDto,
  PrepBatchDto,
  PrepRecipeDto,
  PurchaseRequestStatus,
  QuotationStatus,
  StockAdjustmentDto,
  StockCountDto,
  SupplierDto,
  SupplierInvoiceDto,
  SupplierPaymentDto,
  SupplierQuotationDto,
  WasteLogDto,
  WasteReason,
} from "@nodedr-restaurant/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Ingredient {
  id: string;
  name: string;
  sku: string | null;
  unit: IngredientUnit;
  reorderLevel: string;
  currentStock: string;
  costPerUnit: string;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface PurchaseOrderItem {
  id: string;
  ingredientId: string;
  ingredient?: Ingredient;
  quantityOrdered: string;
  unitCost: string;
  quantityReceived: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  supplierId: string;
  supplier: { id: string; name: string };
  expectedDate: string | null;
  notes: string | null;
  totalAmount: string;
  createdBy: { id: string; name: string };
  createdAt: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  goodsReceipts: {
    id: string;
    grnNumber: string;
    receivedAt: string;
    receivedBy: { id: string; name: string };
    items: unknown[];
  }[];
}

export interface StockBatch {
  id: string;
  batchNumber: string;
  quantityReceived: string;
  quantityRemaining: string;
  unitCost: string;
  expiryDate: string | null;
  receivedAt: string;
}

export interface StockMovement {
  id: string;
  type: "RECEIPT" | "WASTE" | "ADJUSTMENT" | "CONSUMPTION" | "REVERSAL" | "PRODUCTION";
  quantity: string;
  note: string | null;
  createdBy: { id: string; name: string };
  createdAt: string;
}

export interface WasteLog {
  id: string;
  ingredientId: string;
  ingredient: { id: string; name: string; unit: IngredientUnit };
  quantity: string;
  reason: WasteReason;
  unitCostAtWaste: string;
  notes: string | null;
  createdBy: { id: string; name: string };
  createdAt: string;
}

export interface RecipeLine {
  id: string;
  ingredientId: string;
  ingredientName: string;
  unit: IngredientUnit;
  quantity: number;
  costPerUnit: number;
  lineCost: number;
}

export interface Recipe {
  lines: RecipeLine[];
  totalCost: number;
}

export interface PurchaseRequestItem {
  id: string;
  ingredientId: string;
  ingredient: Ingredient;
  quantityRequested: string;
  notes: string | null;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  status: PurchaseRequestStatus;
  notes: string | null;
  requestedBy: { id: string; name: string };
  approvedBy: { id: string; name: string } | null;
  createdAt: string;
  items: PurchaseRequestItem[];
}

export interface SupplierQuotationItem {
  id: string;
  ingredientId: string;
  ingredient: Ingredient;
  quantityQuoted: string;
  unitPrice: string;
}

export interface SupplierQuotation {
  id: string;
  quotationNumber: string;
  status: QuotationStatus;
  validUntil: string | null;
  notes: string | null;
  supplier: { id: string; name: string };
  createdAt: string;
  items: SupplierQuotationItem[];
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: string;
  amountPaid: string;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  notes: string | null;
  supplier: { id: string; name: string };
  payments: {
    id: string;
    amount: string;
    paymentMethod: string;
    reference: string | null;
    paidAt: string;
  }[];
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  totalPurchaseOrders: number;
  totalSpend: number;
  onTimeDeliveryRate: number | null;
  avgLeadTimeDays: number | null;
}

// --- Ingredients -----------------------------------------------------------

export function useIngredients(branchId: string | null) {
  return useQuery({
    queryKey: ["inventory", "ingredients", branchId],
    queryFn: () => api.get<Ingredient[]>(`/inventory/ingredients?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

export function useLowStockIngredients(branchId: string | null) {
  return useQuery({
    queryKey: ["inventory", "ingredients", branchId, "low-stock"],
    queryFn: () =>
      api.get<Ingredient[]>(`/inventory/ingredients/low-stock?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

export function useCreateIngredient(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: IngredientDto) =>
      api.post<Ingredient>(`/inventory/ingredients?branchId=${branchId}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "ingredients", branchId] }),
  });
}

export function useUpdateIngredient(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<IngredientDto> }) =>
      api.patch<Ingredient>(`/inventory/ingredients/${id}?branchId=${branchId}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "ingredients", branchId] }),
  });
}

export function useAdjustStock(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: StockAdjustmentDto }) =>
      api.post(`/inventory/ingredients/${id}/adjust?branchId=${branchId}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "ingredients", branchId] }),
  });
}

export function useIngredientMovements(branchId: string | null, ingredientId: string | null) {
  return useQuery({
    queryKey: ["inventory", "movements", branchId, ingredientId],
    queryFn: () =>
      api.get<StockMovement[]>(
        `/inventory/ingredients/${ingredientId}/movements?branchId=${branchId}`,
      ),
    enabled: !!branchId && !!ingredientId,
  });
}

export function useIngredientBatches(branchId: string | null, ingredientId: string | null) {
  return useQuery({
    queryKey: ["inventory", "batches", branchId, ingredientId],
    queryFn: () =>
      api.get<StockBatch[]>(`/inventory/ingredients/${ingredientId}/batches?branchId=${branchId}`),
    enabled: !!branchId && !!ingredientId,
  });
}

// --- Recipe costing ----------------------------------------------------------

export function useRecipe(branchId: string | null, menuItemId: string | null) {
  return useQuery({
    queryKey: ["inventory", "recipe", branchId, menuItemId],
    queryFn: () => api.get<Recipe>(`/inventory/menu-items/${menuItemId}/recipe?branchId=${branchId}`),
    enabled: !!branchId && !!menuItemId,
  });
}

export function useSetRecipe(branchId: string | null, menuItemId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lines: { ingredientId: string; quantity: number }[]) =>
      api.patch<Recipe>(`/inventory/menu-items/${menuItemId}/recipe?branchId=${branchId}`, {
        lines,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "recipe", branchId, menuItemId] });
      qc.invalidateQueries({ queryKey: ["inventory", "tracking"] });
      qc.invalidateQueries({ queryKey: ["inventory", "tracking-status"] });
      qc.invalidateQueries({ queryKey: ["menu"] });
    },
  });
}

// --- Sales-driven stock tracking --------------------------------------------

export type InventoryTracking = "NONE" | "RECIPE" | "DIRECT";

export interface MenuItemTracking {
  id: string;
  inventoryTracking: InventoryTracking;
  stockIngredientId: string | null;
  stockQuantityPerSale: number;
  isCombo: boolean;
}

export interface TrackingStatus {
  tracked: number;
  untracked: number;
  problems: { menuItemId: string; name: string; reason: "NO_RECIPE" | "NO_STOCK_ITEM" | "UNKNOWN_ITEM" }[];
}

export function useTracking(branchId: string | null, menuItemId: string | null) {
  return useQuery({
    queryKey: ["inventory", "tracking", branchId, menuItemId],
    queryFn: () => api.get<MenuItemTracking>(`/inventory/menu-items/${menuItemId}/tracking?branchId=${branchId}`),
    enabled: !!branchId && !!menuItemId,
  });
}

export function useSetTracking(branchId: string | null, menuItemId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { inventoryTracking: InventoryTracking; stockIngredientId?: string | null; stockQuantityPerSale?: number }) =>
      api.patch<MenuItemTracking>(`/inventory/menu-items/${menuItemId}/tracking?branchId=${branchId}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "tracking"] });
      qc.invalidateQueries({ queryKey: ["inventory", "tracking-status"] });
    },
  });
}

export function useTrackingStatus(branchId: string | null) {
  return useQuery({
    queryKey: ["inventory", "tracking-status", branchId],
    queryFn: () => api.get<TrackingStatus>(`/inventory/tracking-status?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

// --- Suppliers ---------------------------------------------------------------

export function useSuppliers(branchId: string | null) {
  return useQuery({
    queryKey: ["inventory", "suppliers", branchId],
    queryFn: () => api.get<Supplier[]>(`/inventory/suppliers?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

export function useCreateSupplier(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SupplierDto) => api.post<Supplier>(`/inventory/suppliers?branchId=${branchId}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "suppliers", branchId] }),
  });
}

// --- Purchase orders -----------------------------------------------------------

export function usePurchaseOrders(branchId: string | null, status?: PurchaseOrderStatus) {
  return useQuery({
    queryKey: ["inventory", "purchase-orders", branchId, status],
    queryFn: () =>
      api.get<PurchaseOrder[]>(
        `/inventory/purchase-orders?branchId=${branchId}${status ? `&status=${status}` : ""}`,
      ),
    enabled: !!branchId,
  });
}

export function usePurchaseOrder(branchId: string | null, id: string | null) {
  return useQuery({
    queryKey: ["inventory", "purchase-orders", branchId, "detail", id],
    queryFn: () =>
      api.get<PurchaseOrderDetail>(`/inventory/purchase-orders/${id}?branchId=${branchId}`),
    enabled: !!branchId && !!id,
  });
}

export function useCreatePurchaseOrder(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: PurchaseOrderDto) =>
      api.post<PurchaseOrder>(`/inventory/purchase-orders?branchId=${branchId}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", branchId] }),
  });
}

export function useUpdatePurchaseOrderStatus(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseOrderStatus }) =>
      api.patch<PurchaseOrder>(`/inventory/purchase-orders/${id}/status?branchId=${branchId}`, {
        status,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", branchId] }),
  });
}

// --- Goods receipts (GRN) -----------------------------------------------------

export function useCreateGoodsReceipt(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: GoodsReceiptDto) =>
      api.post(`/inventory/goods-receipts?branchId=${branchId}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", branchId] });
      qc.invalidateQueries({ queryKey: ["inventory", "ingredients", branchId] });
      qc.invalidateQueries({ queryKey: ["inventory", "goods-receipts", branchId] });
    },
  });
}

export function useGoodsReceipts(branchId: string | null) {
  return useQuery({
    queryKey: ["inventory", "goods-receipts", branchId],
    queryFn: () => api.get(`/inventory/goods-receipts?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

// --- Waste -----------------------------------------------------------------------

export function useWasteLogs(branchId: string | null) {
  return useQuery({
    queryKey: ["inventory", "waste", branchId],
    queryFn: () => api.get<WasteLog[]>(`/inventory/waste?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

export function useLogWaste(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: WasteLogDto) => api.post(`/inventory/waste?branchId=${branchId}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "waste", branchId] });
      qc.invalidateQueries({ queryKey: ["inventory", "ingredients", branchId] });
    },
  });
}

// --- Purchase requests ----------------------------------------------------------

export function usePurchaseRequests(branchId: string | null, status?: PurchaseRequestStatus) {
  return useQuery({
    queryKey: ["inventory", "purchase-requests", branchId, status],
    queryFn: () =>
      api.get<PurchaseRequest[]>(
        `/inventory/purchase-requests?branchId=${branchId}${status ? `&status=${status}` : ""}`,
      ),
    enabled: !!branchId,
  });
}

export function useCreatePurchaseRequest(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: PurchaseRequestDto) =>
      api.post<PurchaseRequest>(`/inventory/purchase-requests?branchId=${branchId}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "purchase-requests", branchId] }),
  });
}

export function useUpdatePurchaseRequestStatus(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseRequestStatus }) =>
      api.patch<PurchaseRequest>(`/inventory/purchase-requests/${id}/status?branchId=${branchId}`, {
        status,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "purchase-requests", branchId] }),
  });
}

// --- Supplier quotations ---------------------------------------------------------

export function useQuotations(branchId: string | null, ingredientId?: string) {
  return useQuery({
    queryKey: ["inventory", "quotations", branchId, ingredientId],
    queryFn: () =>
      api.get<SupplierQuotation[]>(
        `/inventory/quotations?branchId=${branchId}${ingredientId ? `&ingredientId=${ingredientId}` : ""}`,
      ),
    enabled: !!branchId,
  });
}

export function useCreateQuotation(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SupplierQuotationDto) =>
      api.post<SupplierQuotation>(`/inventory/quotations?branchId=${branchId}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "quotations", branchId] }),
  });
}

export function useUpdateQuotationStatus(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuotationStatus }) =>
      api.patch<SupplierQuotation>(`/inventory/quotations/${id}/status?branchId=${branchId}`, {
        status,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "quotations", branchId] }),
  });
}

// --- Supplier invoices & payments -------------------------------------------------

export function useSupplierInvoices(branchId: string | null, supplierId?: string) {
  return useQuery({
    queryKey: ["inventory", "supplier-invoices", branchId, supplierId],
    queryFn: () =>
      api.get<SupplierInvoice[]>(
        `/inventory/supplier-invoices?branchId=${branchId}${supplierId ? `&supplierId=${supplierId}` : ""}`,
      ),
    enabled: !!branchId,
  });
}

export function useCreateSupplierInvoice(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SupplierInvoiceDto) =>
      api.post<SupplierInvoice>(`/inventory/supplier-invoices?branchId=${branchId}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "supplier-invoices", branchId] }),
  });
}

export function useRecordSupplierPayment(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, dto }: { invoiceId: string; dto: SupplierPaymentDto }) =>
      api.post(`/inventory/supplier-invoices/${invoiceId}/payments?branchId=${branchId}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "supplier-invoices", branchId] }),
  });
}

export interface StockCountLine {
  id: string;
  ingredientId: string;
  expectedQty: number;
  countedQty: number;
  varianceQty: number;
  ingredient: { id: string; name: string; unit: IngredientUnit };
}

export interface StockCount {
  id: string;
  countNumber: string;
  status: "DRAFT" | "POSTED";
  notes: string | null;
  countedAt: string;
  postedAt: string | null;
  countedBy: { id: string; name: string };
  lines?: StockCountLine[];
  _count?: { lines: number };
}

export interface PrepRecipe {
  id: string;
  name: string;
  outputIngredientId: string;
  outputQuantity: string;
  notes: string | null;
  outputIngredient: { id: string; name: string; unit: IngredientUnit };
  lines: {
    id: string;
    ingredientId: string;
    quantity: string;
    ingredient: { id: string; name: string; unit: IngredientUnit };
  }[];
}

export interface PrepBatch {
  id: string;
  batchNumber: string;
  batchMultiplier: string;
  quantityProduced: string;
  theoreticalOutput: number;
  yieldPct: number;
  notes: string | null;
  producedAt: string;
  prepRecipe: { id: string; name: string };
  outputIngredient: { id: string; name: string; unit: IngredientUnit };
  producedBy: { id: string; name: string };
}

export interface YieldReport {
  from: string;
  to: string;
  totals: {
    theoretical: number;
    actualUsage: number;
    waste: number;
    unexplained: number;
    wasteCost: number;
    unexplainedCost: number;
  };
  rows: {
    ingredientId: string;
    name: string;
    unit: IngredientUnit;
    opening: number;
    receipts: number;
    closing: number;
    theoretical: number;
    productionOut: number;
    waste: number;
    actualUsage: number;
    unexplained: number;
    wastePct: number;
    yieldPct: number;
    unexplainedPct: number;
    yieldLoss: number;
    unexplainedCost: number;
    wasteCost: number;
  }[];
}

export interface PriceVarianceReport {
  from: string;
  to: string;
  lines: {
    goodsReceiptItemId: string;
    grnNumber: string;
    receivedAt: string;
    ingredientName: string;
    supplierName: string;
    unit: IngredientUnit;
    qty: number;
    actual: number;
    po: number | null;
    quoted: number | null;
    varianceVsPo: number | null;
    varianceVsQuote: number | null;
    pctVsPo: number | null;
    pctVsQuote: number | null;
  }[];
  summary: {
    ingredientId: string;
    ingredientName: string;
    supplierId: string;
    supplierName: string;
    qty: number;
    avg: number;
    min: number;
    max: number;
    varianceVsPo: number;
    varianceVsQuote: number;
  }[];
}

export function useStockCounts(branchId: string | null) {
  return useQuery({
    queryKey: ["inventory", "stock-counts", branchId],
    queryFn: () => api.get<StockCount[]>(`/inventory/stock-counts?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

export function useStockCount(branchId: string | null, id: string | null) {
  return useQuery({
    queryKey: ["inventory", "stock-counts", branchId, id],
    queryFn: () => api.get<StockCount>(`/inventory/stock-counts/${id}?branchId=${branchId}`),
    enabled: !!branchId && !!id,
  });
}

export function useCreateStockCount(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: StockCountDto) =>
      api.post<StockCount>(`/inventory/stock-counts?branchId=${branchId}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "stock-counts", branchId] }),
  });
}

export function usePostStockCount(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<StockCount>(`/inventory/stock-counts/${id}/post?branchId=${branchId}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "stock-counts", branchId] });
      qc.invalidateQueries({ queryKey: ["inventory", "ingredients", branchId] });
      qc.invalidateQueries({ queryKey: ["inventory", "yield", branchId] });
    },
  });
}

export function usePrepRecipes(branchId: string | null) {
  return useQuery({
    queryKey: ["inventory", "prep-recipes", branchId],
    queryFn: () => api.get<PrepRecipe[]>(`/inventory/prep-recipes?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

export function useCreatePrepRecipe(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: PrepRecipeDto) =>
      api.post<PrepRecipe>(`/inventory/prep-recipes?branchId=${branchId}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "prep-recipes", branchId] }),
  });
}

export function useDeletePrepRecipe(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/prep-recipes/${id}?branchId=${branchId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "prep-recipes", branchId] }),
  });
}

export function usePrepBatches(branchId: string | null) {
  return useQuery({
    queryKey: ["inventory", "prep-batches", branchId],
    queryFn: () => api.get<PrepBatch[]>(`/inventory/prep-batches?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

export function useRecordPrepBatch(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: PrepBatchDto) =>
      api.post<PrepBatch>(`/inventory/prep-batches?branchId=${branchId}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "prep-batches", branchId] });
      qc.invalidateQueries({ queryKey: ["inventory", "ingredients", branchId] });
    },
  });
}

export function useYieldReport(branchId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["inventory", "yield", branchId, from, to],
    queryFn: () =>
      api.get<YieldReport>(`/inventory/yield?branchId=${branchId}&from=${from}&to=${to}`),
    enabled: !!branchId && !!from && !!to,
  });
}

export interface DemandForecast {
  id: string;
  forecastNumber: string;
  historyDays: number;
  horizonDays: number;
  source: string;
  model: string | null;
  weatherUsed: boolean;
  modelError: string | null;
  generatedAt: string;
  generatedBy: { id: string; name: string };
  _count?: { lines: number };
  lines?: DemandForecastLine[];
}

export interface DemandForecastLine {
  id: string;
  kind: "ITEM" | "INGREDIENT";
  name: string;
  unit: string | null;
  historyQty: string;
  dailyVelocity: string;
  localForecastQty: string;
  modelForecastQty: string | null;
  forecastQty: string;
  leadTimeDays: string | null;
  currentStock: string | null;
  suggestedReorderQty: string | null;
}

export function useForecasts(branchId: string | null) {
  return useQuery({
    queryKey: ["inventory", "forecasts", branchId],
    queryFn: () => api.get<DemandForecast[]>(`/inventory/forecasts?branchId=${branchId}`),
    enabled: !!branchId,
  });
}

export function useForecast(branchId: string | null, id: string | null) {
  return useQuery({
    queryKey: ["inventory", "forecasts", branchId, id],
    queryFn: () => api.get<DemandForecast>(`/inventory/forecasts/${id}?branchId=${branchId}`),
    enabled: !!branchId && !!id,
  });
}

export function useGenerateForecast(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<DemandForecast>(`/inventory/forecasts?branchId=${branchId}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "forecasts", branchId] }),
  });
}

export function useApplyForecastReorders(branchId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/inventory/forecasts/${id}/apply-reorders?branchId=${branchId}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-requests", branchId] });
    },
  });
}

export function usePriceVariance(branchId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["inventory", "price-variance", branchId, from, to],
    queryFn: () =>
      api.get<PriceVarianceReport>(
        `/inventory/price-variance?branchId=${branchId}&from=${from}&to=${to}`,
      ),
    enabled: !!branchId && !!from && !!to,
  });
}

export function useSupplierPerformance(branchId: string | null, supplierId: string | null) {
  return useQuery({
    queryKey: ["inventory", "supplier-performance", branchId, supplierId],
    queryFn: () =>
      api.get<SupplierPerformance>(`/inventory/suppliers/${supplierId}/performance?branchId=${branchId}`),
    enabled: !!branchId && !!supplierId,
  });
}
