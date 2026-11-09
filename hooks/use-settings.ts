"use client";

import type {
  BranchSettingsDto,
  RestaurantSettingsDto,
  TaxMode,
  TaxRegime,
} from "@nodedr-restaurant/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface RestaurantSettings {
  id: string;
  name: string;
  legalName: string | null;
  logoUrl: string | null;
  currency: string;
  timezone: string;
  upiVpa: string | null;
  upiPayeeName: string | null;
  demoMode: boolean;
  agentMode?: "HUMAN" | "AUTO";
  loyaltyPointValue: string;
  loyaltyEarnPerCurrency: number;
  referralPoints?: number;
  birthdayDiscountPercent?: string;
  fssaiNumber?: string | null;
  receiptEmail?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpFrom?: string | null;
  smtpSecure?: boolean;
  smtpConfigured?: boolean;
  tallyEnabled?: boolean;
  tallyCompanyName?: string | null;
  tallyHost?: string | null;
  tallyPort?: number | null;
  tallyUseHttps?: boolean;
  tallyLedgers?: { sourceKey: string; ledgerName: string }[];
  syncEnabled?: boolean;
  syncHqUrl?: string | null;
  syncHqTokenConfigured?: boolean;
  syncIntervalSec?: number;
  payCash?: boolean;
  payCard?: boolean;
  payUpi?: boolean;
  payOther?: boolean;
  preferredPaymentMethod?: "UPI" | "CASH" | "CARD" | "OTHER" | null;
  paymentMethodOrder?: Array<"UPI" | "CASH" | "CARD" | "OTHER">;
  cashLabel?: string;
  billPayLinkEnabled?: boolean;
  billPayLinkWhatsappMessage?: string;
  receiptWhatsApp?: boolean;
  receiptEmailEnabled?: boolean;
  receiptPrint?: boolean;
  employeeDiscountPercent?: string | number;
  reservationMessage?: string | null;
  waCloudEnabled?: boolean;
  waCloudBaseUrl?: string | null;
  waCloudPhoneNumberId?: string | null;
  waCloudTemplateName?: string | null;
  waCloudTemplateLang?: string | null;
  waCloudTokenConfigured?: boolean;
  bulkWaEnabled?: boolean;
  bulkWaBaseUrl?: string | null;
  bulkWaApiKeyConfigured?: boolean;
  bulkWaWebhookSecretConfigured?: boolean;
  smsEnabled?: boolean;
  smsProvider?: string | null;
  smsBaseUrl?: string | null;
  smsSenderId?: string | null;
  smsCountryPrefix?: string | null;
  smsApiKeyConfigured?: boolean;
  clvHorizonMonths?: number;
  clvMarginPercent?: string | number;
  aiEnabled?: boolean;
  aiProvider?: string | null;
  aiBaseUrl?: string | null;
  aiModel?: string | null;
  aiTokenConfigured?: boolean;
  aiHistoryDays?: number;
  aiHorizonDays?: number;
  aiLeadTimeDays?: number | null;
  weatherBaseUrl?: string | null;
  weatherApiKeyConfigured?: boolean;
}

export interface BranchSettings {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  gstNumber: string | null;
  gstStateCode?: string | null;
  serviceChargePercent?: string;
  country: string;
  taxRegime: TaxRegime;
  taxMode: TaxMode;
  taxLabel: string | null;
  taxId: string | null;
  autoConfirmOrders: boolean;
  autoConfirmReservations: boolean;
  kioskToken: string | null;
  kioskDineInEnabled: boolean;
  kioskTakeawayEnabled: boolean;
  pickupDisplayToken?: string | null;
  payBeforeKitchenKiosk?: boolean;
  payBeforeKitchenTakeaway?: boolean;
  guestPaidClaimEnabled?: boolean;
  guestCodRequestEnabled?: boolean;
  guestWaiterEnabled?: boolean;
  guestBillEnabled?: boolean;
  deliveryTrackingRadiusKm?: number;
  deliveryTrackingStaleMinutes?: number;
  deliveryTrackingLat?: number | null;
  deliveryTrackingLng?: number | null;
  leaveAnnualDays?: number;
  leaveSickDays?: number;
  payrollStatutoryEnabled?: boolean;
  payrollPfRate?: number;
  payrollPfWageCeiling?: number;
  payrollEsiGrossLimit?: number;
  payrollEsiEmployeeRate?: number;
  payrollEsiEmployerRate?: number;
  expenseCategories?: string[];
  expenseRequireApproval?: boolean;
  cashVarianceWarnAmount?: number;
  pettyCashInTillClose?: boolean;
  printerPaperWidthMm: 58 | 80;
  printerCodepage: "CP437" | "CP850" | "CP858" | "CP1252";
  printerColumns: number | null;
  printerConnection: "USB" | "NETWORK";
  printerHost: string | null;
  printerPort: number;
}

export function useSettings(branchId: string | null) {
  return useQuery({
    queryKey: ["settings", branchId],
    queryFn: () =>
      api.get<{ restaurant: RestaurantSettings; branch: BranchSettings }>(
        `/settings?branchId=${branchId}`,
      ),
    enabled: !!branchId,
  });
}

export function useUpdateRestaurantSettings(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RestaurantSettingsDto) => api.patch("/settings/restaurant", dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", branchId] }),
  });
}

export function useUploadRestaurantLogo() {
  return useMutation({
    mutationFn: (file: File) => api.upload<{ url: string }>("/settings/restaurant/logo", file),
  });
}

export function useUpdateBranchSettings(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BranchSettingsDto) =>
      api.patch(`/settings/branch?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", branchId] }),
  });
}

export function useSetKiosk(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: "enable" | "rotate" | "disable") =>
      api.post<{ kioskToken: string | null }>(`/settings/kiosk/${action}?branchId=${branchId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", branchId] }),
  });
}

export function useSetPickupBoard(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: "enable" | "rotate" | "disable") =>
      api.post<{ pickupDisplayToken: string | null }>(
        `/settings/pickup/${action}?branchId=${branchId}`,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", branchId] }),
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: (to: string) =>
      api.post<{ ok: true; provider: string; from: string }>("/settings/email/test", { to }),
  });
}

export type OnboardingStep =
  | "business"
  | "branch"
  | "floor"
  | "menu"
  | "guests"
  | "done";

export type OnboardingConfig = {
  labelBusiness: string;
  labelBranch: string;
  labelFloor: string;
  labelMenu: string;
  labelGuests: string;
  bodyBusiness: string;
  bodyBranch: string;
  bodyFloor: string;
  bodyMenu: string;
  bodyGuests: string;
  defaultFloorName: string;
  defaultTableCount: string;
  defaultTableCapacity: string;
  defaultCategoryName: string;
  defaultDishName: string;
  defaultDishPrice: string;
  defaultDishTaxPercent: string;
};

export type OnboardingStatus = {
  enabled: boolean;
  completed: boolean;
  skipped: boolean;
  step: OnboardingStep;
  needsWizard: boolean;
  checks: {
    business: boolean;
    branch: boolean;
    floor: boolean;
    menu: boolean;
    guests: boolean;
    upiOptional: boolean;
  };
  config: OnboardingConfig;
  counts: { floors: number; tables: number; menuItems: number };
};

export function useOnboarding(branchId: string | null) {
  return useQuery({
    queryKey: ["settings", "onboarding", branchId],
    queryFn: () =>
      api.get<OnboardingStatus>(`/settings/onboarding?branchId=${branchId}`),
    enabled: !!branchId,
    staleTime: 15_000,
  });
}

export function usePatchOnboarding(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      action: "advance" | "complete" | "skip" | "reopen" | "set_enabled" | "set_config";
      step?: OnboardingStep;
      enabled?: boolean;
      config?: Partial<OnboardingConfig>;
    }) => api.patch<OnboardingStatus>(`/settings/onboarding?branchId=${branchId}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "onboarding", branchId] });
      queryClient.invalidateQueries({ queryKey: ["settings", branchId] });
    },
  });
}
