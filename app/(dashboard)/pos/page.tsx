"use client";

import { Camera, ChevronLeft, MonitorSmartphone, ShoppingCart } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { StatusNote, useNoteToast } from "@/components/ui/status-note";
import { publishDisplay } from "@/lib/customer-display";
import { BranchNotice } from "@/components/layout/branch-notice";
import { CartPanel, type DeliveryDetails, type PosOrderType } from "@/components/pos/cart-panel";
import { cartLineKey, portionText, type CartLine, type Portion } from "@/components/pos/cart-line";
import { clearDraft, switchTableDraft, type Drafts } from "@/lib/pos-drafts";
import { CheckoutPanel } from "@/components/pos/checkout-panel";
import { KitchenProgressWidget } from "@/components/pos/kitchen-progress-widget";
import { ModifierPickerDialog } from "@/components/pos/modifier-picker-dialog";
import { PosTablePicker } from "@/components/pos/pos-table-picker";
import { ProductGrid } from "@/components/pos/product-grid";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import { useMenuItems, useSalesChannels, type MenuItem } from "@/hooks/use-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAddOrderItems,
  useCreateOrder,
  useOpenOrdersForTable,
  type CreatedOrder,
  type OpenOrder,
} from "@/hooks/use-orders";
import { useFloors, type RestaurantTable } from "@/hooks/use-tables";
import { ApiError, api } from "@/lib/api";
import { enqueueRequest, flushQueue } from "@/lib/offline-queue";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BarcodeScannerDialog } from "@/components/pos/barcode-scanner-dialog";

export default function PosPage() {
  return (
    <Suspense fallback={null}>
      <PosPageInner />
    </Suspense>
  );
}

function PosPageInner() {
  const { branchId, isLoading: branchLoading } = useBranch();
  const { note, clear: clearNote, toast } = useNoteToast();
  const floorsQuery = useFloors(branchId);
  const floors = floorsQuery.data;
  const tables = floors?.flatMap((f) => f.tables) ?? [];
  const preselectedTableId = useSearchParams().get("tableId") ?? "";

  const [lines, setLines] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<PosOrderType>("DINE_IN");
  const [delivery, setDelivery] = useState<DeliveryDetails>({ address: "", pincode: "", phone: "" });
  const [scheduledFor, setScheduledFor] = useState("");
  const [tableId, setTableIdRaw] = useState(preselectedTableId);
  // Unsent cart per table, so switching tables never moves or loses items.
  const [drafts, setDrafts] = useState<Drafts<CartLine>>({});
  const setTableId = (next: string) => {
    if (next === tableId) return;
    const r = switchTableDraft(drafts, tableId, next, lines);
    setDrafts(r.drafts);
    setLines(r.lines);
    setSelectedBillId(null);
    setTableIdRaw(next);
  };
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [pickerItem, setPickerItem] = useState<MenuItem | null>(null);
  const [activeOrder, setActiveOrder] = useState<CreatedOrder | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<OpenOrder["customer"]>(null);
  // /pos?tableId=... can change while this page stays mounted.
  const [seenPreselected, setSeenPreselected] = useState(preselectedTableId);
  if (preselectedTableId !== seenPreselected) {
    setSeenPreselected(preselectedTableId);
    if (preselectedTableId && !activeOrder) setTableId(preselectedTableId);
  }
  // Phones show the menu full-screen and the cart/checkout as an overlay; from
  // lg up both sit side by side and this flag is ignored.
  const [cartOpen, setCartOpen] = useState(false);
  const [hold, setHold] = useState(false);

  // Mirror the cart to the customer-facing display (/customer-display).
  useEffect(() => {
    if (activeOrder) return;
    publishDisplay(
      lines.length === 0
        ? { kind: "idle" }
        : {
            kind: "cart",
            lines: lines.map((l) => ({
              name: l.modifierLabel ? `${l.name} (${l.modifierLabel})` : l.name,
              quantity: l.quantity,
              total: l.unitPrice * l.quantity,
            })),
            subtotal: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
          },
    );
  }, [lines, activeOrder]);

  const createOrder = useCreateOrder(branchId);
  const addOrderItems = useAddOrderItems(branchId);
  const openBillsQuery = useOpenOrdersForTable(
    branchId,
    orderType === "DINE_IN" ? tableId || null : null,
  );
  const existingOrders = openBillsQuery.data;
  // A table can carry several open bills; the user picks which one gets the
  // new items (default: the newest). Until the table's bills are loaded we do
  // not know whether this is a new bill or a new round, so submitting waits.
  const checkingTable =
    orderType === "DINE_IN" && !!tableId && (openBillsQuery.isPending || openBillsQuery.isFetching);
  const existingOrder =
    existingOrders?.find((o) => o.id === selectedBillId) ?? existingOrders?.[0];

  const addLine = (
    menuItemId: string,
    name: string,
    unitPrice: number,
    modifierIds: string[],
    modifierLabel: string,
    portion?: Portion,
    weightKg?: number,
    sizeId?: string,
  ) => {
    const key = `${cartLineKey(menuItemId, modifierIds, portion, sizeId)}${weightKg ? `::${weightKg}` : ""}`;
    const priced = weightKg ? unitPrice * weightKg : unitPrice;
    const label = weightKg ? `${name} (${weightKg.toFixed(3)} kg)` : name;
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing && !weightKg) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
      }
      if (existing) return prev;
      return [...prev, { key, menuItemId, name: label, unitPrice: priced, quantity: 1, modifierIds, modifierLabel, portion, weightKg, sizeId }];
    });
  };

  const [weightItem, setWeightItem] = useState<MenuItem | null>(null);
  const [weightText, setWeightText] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [salesChannelId, setSalesChannelId] = useState("");
  const [deviceMessage, setDeviceMessage] = useState("");
  useEffect(() => {
    if (!branchId) return;
    let cancelled = false;
    const boot = async () => {
      if (!localStorage.getItem("nodedr-device-token")) {
        try {
          const row = await api.post<{ token: string }>(`/platform/devices?branchId=${branchId}`, { name: "POS" });
          localStorage.setItem("nodedr-device-token", row.token);
        } catch {
          return;
        }
      }
      try {
        const me = await api.get<{ config?: { message?: string } }>("/platform/devices/me");
        if (!cancelled) setDeviceMessage(me.config?.message ?? "");
      } catch {
        /* a register without a token yet just skips the remote message */
      }
      await api.post("/platform/devices/heartbeat", { version: "web" }).catch(() => undefined);
    };
    void boot();
    const timer = window.setInterval(() => {
      void api.post("/platform/devices/heartbeat", { version: "web" }).catch(() => undefined);
    }, 60_000);
    const flush = () => {
      void flushQueue("pos-queue", async (item) => {
        await api.post(item.path, item.body);
      })
        .then((result) => {
          if (result.conflicts.length) toast.error("A queued order conflicts with one already saved");
        })
        .then(() =>
          flushQueue("pos-pay-queue", async (item) => {
            await api.post(item.path, item.body);
          }),
        )
        .then((result) => {
          if (result && result.sent > 0) toast.success("A saved payment was recorded.");
        });
    };
    window.addEventListener("online", flush);
    flush();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("online", flush);
    };
  }, [branchId, toast]);
  const menuQuery = useMenuItems(branchId);
  const channelsQuery = useSalesChannels(branchId);
  const channels = channelsQuery.data ?? [];
  useEffect(() => {
    const match = channels.find((row) => row.isActive && row.orderType === orderType);
    if (match) setSalesChannelId(match.id);
  }, [orderType, channels]);

  const priceForChannel = (item: MenuItem): MenuItem => {
    const channel = channels.find((row) => row.id === salesChannelId);
    if (!channel) return item;
    const base = Number(item.price);
    const override = item.channelPrices?.find((row) => row.channelId === channel.id);
    const next = override
      ? Number(override.price)
      : base * (1 + Number(channel.markupPercent) / 100);
    const factor = base > 0 ? next / base : 1;
    const money = (n: number) => (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);
    return {
      ...item,
      price: money(next),
      halfPrice: item.halfPrice == null ? item.halfPrice : money(Number(item.halfPrice) * factor),
      sizes: item.sizes?.map((size) => ({ ...size, price: money(Number(size.price) * factor) })),
    };
  };

  const handleSelect = (item: MenuItem) => {
    const priced = priceForChannel(item);
    if (priced.soldByWeight) {
      setWeightItem(priced);
      setWeightText("");
      return;
    }
    if (priced.modifierGroups.length > 0 || priced.halfPrice != null || (priced.sizes?.length ?? 0) > 0) {
      setPickerItem(priced);
      return;
    }
    addLine(priced.id, priced.name, Number(priced.price), [], "");
  };

  const addWeight = (kg: number) => {
    if (!weightItem || !(kg > 0)) return;
    addLine(weightItem.id, weightItem.name, Number(weightItem.price), [], "", undefined, kg);
    setWeightItem(null);
    setWeightText("");
  };

  const readScale = async () => {
    const serial = (navigator as Navigator & { serial?: { requestPort: () => Promise<{ open: (o: { baudRate: number }) => Promise<void>; readable: ReadableStream<Uint8Array> | null; close: () => Promise<void> }> } }).serial;
    if (!serial) {
      toast.error("This browser has no serial scale. Type the weight.");
      return;
    }
    const port = await serial.requestPort();
    await port.open({ baudRate: 9600 });
    const reader = port.readable?.getReader();
    if (!reader) {
      toast.error("The scale did not open.");
      return;
    }
    const { value } = await reader.read();
    reader.releaseLock();
    await port.close();
    const text = new TextDecoder().decode(value ?? new Uint8Array());
    const match = text.match(/(\d+[.,]\d+|\d+)/);
    if (!match) {
      toast.error("The scale did not send a weight.");
      return;
    }
    setWeightText(match[1].replace(",", "."));
  };

  const findByBarcode = (code: string) => {
    const needle = code.trim().toLowerCase();
    const item = (menuQuery.data ?? []).find(
      (row) => row.isActive && (row.barcode?.trim() === code.trim() || (row.sku ?? "").trim().toLowerCase() === needle),
    );
    if (!item) {
      toast.error(`No dish uses barcode or SKU ${code}`);
      return;
    }
    handleSelect(item);
  };

  const submitScan = () => {
    const code = scanCode.trim();
    setScanCode("");
    if (!code) return;
    findByBarcode(code);
  };

  const handleModifierConfirm = (
    modifierIds: string[],
    modifierLabel: string,
    portion?: Portion,
    sizeId?: string,
  ) => {
    if (!pickerItem) return;
    const modifierTotal = modifierIds.reduce((sum, id) => {
      const mod = pickerItem.modifierGroups
        .flatMap((g) => g.modifierGroup.modifiers)
        .find((m) => m.id === id);
      return sum + (mod ? Number(mod.priceAdjustment) : 0);
    }, 0);
    const size = pickerItem.sizes?.find((row) => row.id === sizeId);
    const base =
      size != null
        ? Number(size.price)
        : portion?.customPrice ??
          (portion?.kind === "HALF" ? Number(pickerItem.halfPrice) : Number(pickerItem.price));
    const name = size
      ? `${pickerItem.name} (${size.name})`
      : portion
        ? `${pickerItem.name} (${portionText(portion)})`
        : pickerItem.name;
    addLine(pickerItem.id, name, base + modifierTotal, modifierIds, modifierLabel, portion, undefined, sizeId);
  };

  const updateQuantity = (key: string, delta: number) => {
    setLines((prev) => {
      const target = prev.find((line) => line.key === key);
      if (target?.weightKg) return prev;
      return prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0);
    });
  };

  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));
  const setLineNote = (key: string, note: string) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, kitchenNote: note } : line)));
  const patchLine = (key: string, patch: Partial<(typeof lines)[number]>) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const handleSubmit = () => {
    if (checkingTable) return;
    const sentTableId = tableId;
    const items = lines.map((l) => ({
      menuItemId: l.menuItemId,
      quantity: l.quantity,
      modifierIds: l.modifierIds,
      ...(l.kitchenNote?.trim() ? { kitchenNote: l.kitchenNote.trim() } : {}),
      ...(l.guestNumber && l.guestNumber > 1 ? { guestNumber: l.guestNumber } : {}),
      ...(l.discountPercent ? { discountPercent: l.discountPercent } : {}),
      ...(l.complimentary ? { complimentary: true } : {}),
      ...(l.sizeId ? { sizeId: l.sizeId } : {}),
      ...(l.weightKg ? { weightKg: l.weightKg, quantity: 1 } : {}),
      ...(l.portion
        ? {
            portion: l.portion.kind,
            customPrice: l.portion.customPrice,
            ...(l.portion.kind === "CUSTOM" ? { customLabel: l.portion.customLabel } : {}),
          }
        : {}),
    }));

    if (existingOrder) {
      addOrderItems.mutate(
        { orderId: existingOrder.id, dto: { items } },
        {
          onSuccess: (order) => {
            setDrafts((d) => clearDraft(d, sentTableId));
            setActiveCustomer(existingOrder.customer);
            setActiveOrder(order);
            toast.success(`Added to order #${order.orderNumber} — sent to kitchen`);
          },
          onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not add items"),
        },
      );
      return;
    }

    const requestId = crypto.randomUUID();
    const dto = {
        type: orderType,
        tableId: orderType === "DINE_IN" ? tableId : undefined,
        ...(orderType === "DELIVERY" ? { delivery } : {}),
        ...(orderType !== "DINE_IN" && scheduledFor
          ? { scheduledFor: new Date(scheduledFor).toISOString() }
          : {}),
        ...(hold ? { held: true } : {}),
        ...(salesChannelId ? { salesChannelId } : {}),
        clientRequestId: requestId,
        items,
      };
    createOrder.mutate(
      dto,
      {
        onSuccess: (order) => {
          setDrafts((d) => clearDraft(d, sentTableId));
          setActiveCustomer(null);
          setActiveOrder(order);
          setCartOpen(true);
          setHold(false);
          toast.success(
            hold
              ? `Order #${order.orderNumber} is on hold. Resume it at checkout to send the kitchen ticket.`
              : `Order #${order.orderNumber} sent to kitchen`,
          );
        },
        onError: (err) => {
          if (!(err instanceof ApiError)) {
            enqueueRequest("pos-queue", {
              id: requestId,
              path: `/orders?branchId=${branchId}`,
              body: dto,
              createdAt: new Date().toISOString(),
            });
            toast.success("Saved on this register. It will send when the server is back.");
            return;
          }
          toast.error(err.message);
        },
      },
    );
  };

  const viewExistingOrder = () => {
    if (existingOrder) {
      setActiveCustomer(existingOrder.customer);
      setActiveOrder(existingOrder);
      setCartOpen(true);
    }
  };

  const resetForNewOrder = () => {
    setActiveOrder(null);
    setCartOpen(false);
    // The sent cart is gone; other tables' unsent drafts stay.
    setLines([]);
    setSelectedBillId(null);
    setTableIdRaw("");
    setActiveCustomer(null);
    setDelivery({ address: "", pincode: "", phone: "" });
    setScheduledFor("");
  };

  const handleTablePick = (table: RestaurantTable) => setTableId(table.id);

  // Click-to-order: for a fresh dine-in ticket, land on a visual table grid
  // first — the rest of the flow (menu, cart, bill-or-add-more) is
  // unchanged once a table's picked. Takeaway orders and orders already
  // mid-flow (tableId set, or viewing/paying an order) skip straight past
  // it, same as arriving here from the Tables page's own "New order" link
  // (?tableId=... pre-fills this and never shows the picker).
  const showTablePicker = orderType === "DINE_IN" && !tableId && !activeOrder;

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col gap-4 lg:h-[calc(100dvh-8rem)]">
      <StatusNote note={note} onClear={clearNote} />
      {deviceMessage ? (
        <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-foreground">{deviceMessage}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <KitchenProgressWidget branchId={branchId} />
        </div>
        <a
          href="/customer-display"
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title="Opens the customer-facing screen in a new window — drag it to the second monitor"
        >
          <MonitorSmartphone className="h-3.5 w-3.5" />
          Customer display
        </a>
      </div>

      <BranchNotice />

      {showTablePicker ? (
        <Card className="flex-1 overflow-hidden p-5">
          <PosTablePicker
            floors={floors ?? []}
            onSelect={handleTablePick}
            isLoading={floorsQuery.isLoading || branchLoading}
            error={floorsQuery.isError ? floorsQuery.error : null}
            onRetry={() => void floorsQuery.refetch()}
            retrying={floorsQuery.isFetching}
          />
        </Card>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-[1fr_360px]">
          <Card className="min-h-0 overflow-hidden p-3 sm:p-5">
            <form
              className="mb-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                submitScan();
              }}
            >
              <Input
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                placeholder="Scan a barcode or type a SKU"
                aria-label="Scan a barcode or type a SKU"
                autoComplete="off"
              />
              <Button type="submit" variant="outline">Add</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setScannerOpen(true)}
              >
                <Camera className="h-4 w-4" />
                {scannerOpen ? "Looking…" : "Camera"}
              </Button>
            </form>
            <BarcodeScannerDialog
              open={scannerOpen}
              onOpenChange={setScannerOpen}
              onDetected={(code) => {
                setScanCode(code);
                findByBarcode(code);
              }}
              onTimeout={() => toast.error("No barcode found. Type the code instead.")}
              onUnavailable={() => toast.error("Camera did not open. Use the scan box.")}
            />
            {weightItem && (
              <form
                className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  addWeight(Number(weightText));
                }}
              >
                <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                  {weightItem.name} weight in kg. The price is per kilogram.
                  <Input
                    inputMode="decimal"
                    value={weightText}
                    onChange={(e) => setWeightText(e.target.value)}
                    aria-label="Weight in kilograms"
                    autoFocus
                  />
                </label>
                <Button type="button" variant="outline" onClick={() => void readScale()}>Read scale</Button>
                <Button type="submit">Add weight</Button>
              </form>
            )}
            {channels.length > 0 && (
              <label className="mb-3 flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Price list</span>
                <select
                  aria-label="Price list"
                  value={salesChannelId}
                  onChange={(e) => setSalesChannelId(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
                >
                  <option value="">Base prices</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                      {Number(channel.markupPercent) ? ` (${channel.markupPercent}%)` : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <ProductGrid branchId={branchId} onSelect={handleSelect} />
          </Card>

          <Card
            className={cn(
              "min-h-0 overflow-hidden p-5",
              cartOpen
                ? "max-lg:fixed max-lg:inset-0 max-lg:z-40 max-lg:rounded-none max-lg:p-4 max-lg:pt-[max(1rem,env(safe-area-inset-top))] max-lg:pb-[max(1rem,env(safe-area-inset-bottom))]"
                : "max-lg:hidden",
            )}
          >
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className="mb-3 -ml-1 flex items-center gap-1 text-sm font-medium text-muted-foreground lg:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to menu
            </button>
            {activeOrder ? (
              <CheckoutPanel
                order={activeOrder}
                branchId={branchId}
                initialCustomer={activeCustomer}
                onDone={resetForNewOrder}
              />
            ) : (
              <CartPanel
                lines={lines}
                orderType={orderType}
                onOrderTypeChange={setOrderType}
                tables={tables}
                tableId={tableId}
                onTableChange={setTableId}
                onIncrement={(key) => updateQuantity(key, 1)}
                onDecrement={(key) => updateQuantity(key, -1)}
                onRemove={removeLine}
                onNote={setLineNote}
                onPatch={patchLine}
                hold={hold}
                onHoldChange={setHold}
                onSubmit={handleSubmit}
                isSubmitting={createOrder.isPending || addOrderItems.isPending}
                existingOrderNumber={existingOrder?.orderNumber}
                onViewExistingOrder={existingOrder ? viewExistingOrder : undefined}
                openBills={existingOrders?.map((o) => ({ id: o.id, orderNumber: o.orderNumber }))}
                selectedBillId={existingOrder?.id ?? null}
                onSelectBill={setSelectedBillId}
                checkingTable={checkingTable}
                delivery={delivery}
                onDeliveryChange={setDelivery}
                scheduledFor={scheduledFor}
                onScheduledForChange={setScheduledFor}
              />
            )}
          </Card>
        </div>
      )}

      {!showTablePicker && !cartOpen && (lines.length > 0 || activeOrder || existingOrder) && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex h-14 items-center justify-between rounded-2xl bg-primary px-4 text-primary-foreground shadow-lg active:scale-[0.98] lg:hidden"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShoppingCart className="h-5 w-5" />
            {activeOrder
              ? `Order #${activeOrder.orderNumber} — pay`
              : lines.length > 0
                ? `View cart · ${lines.reduce((n, l) => n + l.quantity, 0)} items`
                : `Open bill #${existingOrder?.orderNumber} — view`}
          </span>
          {!activeOrder && lines.length > 0 && (
            <span className="text-sm font-semibold tabular-nums">
              {formatCurrency(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0))}
            </span>
          )}
        </button>
      )}

      <ModifierPickerDialog
        item={pickerItem}
        open={!!pickerItem}
        onOpenChange={(open) => !open && setPickerItem(null)}
        onConfirm={handleModifierConfirm}
        allowCustom
      />
    </div>
  );
}
