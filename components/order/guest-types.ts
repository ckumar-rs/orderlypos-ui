export interface PublicMenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl?: string | null;
  price: string;
  isVeg: boolean;
  sizes?: { id: string; name: string; price: string }[];
  modifierGroups: {
    modifierGroup: {
      id: string;
      name: string;
      minSelect: number;
      maxSelect: number;
      isRequired: boolean;
      modifiers: {
        id: string;
        name: string;
        imageUrl?: string | null;
        priceAdjustment: string;
        isDefault: boolean;
      }[];
    };
  }[];
}

export interface CartLine {
  key: string;
  menuItemId: string;
  modifierIds: string[];
  sizeId?: string;
  label: string;
  unitPrice: number;
  quantity: number;
}

export interface PublicStatus {
  order: {
    orderNumber: string;
    status: string;
    acceptance: string;
    items: { id: string; nameSnapshot: string; quantity: number; status: string }[];
  } | null;
  openRequests: ("WAITER" | "BILL")[];
}

export interface PublicMenuCategory {
  id: string;
  name: string;
  items: PublicMenuItem[];
}

export interface PublicMenuResponse {
  branchName: string;
  tableName: string;
  currency?: string;
  guestSignals?: { paidClaim?: boolean; cod?: boolean; waiter?: boolean; bill?: boolean };
  pay?: {
    preferred?: string | null;
    cashLabel?: string;
  };
  categories: PublicMenuCategory[];
}

export const ITEM_STATUS_LABEL: Record<string, string> = {
  NEW: "Received",
  ACCEPTED: "Received",
  PREPARING: "Being prepared",
  READY: "Ready",
  SERVED: "Served",
  CANCELLED: "Cancelled",
};
