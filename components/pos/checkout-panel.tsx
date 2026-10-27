"use client";

import { kitchenProgress, type PaymentMethodDto } from "@nodedr-restaurant/types";
import { ArrowLeft, CheckCircle2, ChefHat, Pencil, Printer } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { StatusNote, useNoteToast } from "@/components/ui/status-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QueryError } from "@/components/ui/query-error";
import { PaymentMethodButtons } from "@/components/pos/payment-method-buttons";
import { CustomerPicker } from "@/components/pos/customer-picker";
import type { Customer } from "@/hooks/use-customers";
import { lookupGiftCard } from "@/hooks/use-gift-cards";
import { CancelOrderDialog, useCanCancelOrders } from "@/components/orders/cancel-order-dialog";
import { EditBillDialog } from "@/components/orders/edit-bill-dialog";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import {
  useBillPreview,
  useCheckoutOrder,
  useOpenOrders,
  useOrder,
  type BillPreview,
  type CheckoutResult,
  type CreatedOrder,
} from "@/hooks/use-orders";
import { usePrintKot, usePrintOrderUsb, type PrintJobResult } from "@/hooks/use-print";
import { useMenuItems } from "@/hooks/use-menu";
import { useSettings } from "@/hooks/use-settings";
import { api, ApiError } from "@/lib/api";
import { discountSummary, parseMoney, planPayment, planSplitPayments } from "@/lib/bill";
import { formatCurrency } from "@/lib/format";
import { publishDisplay } from "@/lib/customer-display";
import { playPaymentReceived } from "@/lib/celebrate";
import { buildUpiUri } from "@/lib/upi";
import { receiptMessage, whatsAppHref } from "@/lib/whatsapp";
import { QRCodeSVG } from "qrcode.react";
import { enqueueRequest, readQueue } from "@/lib/offline-queue";
import { openKotPrint, openReceiptPrint } from "@/lib/print";
import { printTicket } from "@/components/kiosk/kiosk-print";
import { round2 } from "@/lib/pricing-preview";

function enabledMethods(restaurant?: {
  payCash?: boolean;
  payCard?: boolean;
  payUpi?: boolean;
  payOther?: boolean;
}): PaymentMethodDto[] {
  if (!restaurant) return [];
  return (
    [
      restaurant.payCash ? "CASH" : null,
      restaurant.payCard ? "CARD" : null,
      restaurant.payUpi ? "UPI" : null,
      restaurant.payOther ? "OTHER" : null,
    ] as (PaymentMethodDto | null)[]
  ).filter((method): method is PaymentMethodDto => method != null);
}

interface SplitLine {
  id: string;
  method: PaymentMethodDto;
  amount: string;
  reference: string;
}

const KITCHEN_LABEL: Record<string, string> = {
  NEW: "Waiting for the kitchen",
  ACCEPTED: "Kitchen accepted",
  PREPARING: "Being prepared",
  READY: "Ready to serve",
  SERVED: "Served",
};

/** Re-evaluates a value after the user has stopped changing it for `ms`. */
function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function CheckoutPanel({
  order: orderSnapshot,
  branchId,
  initialCustomer = null,
  onDone,
}: {
  order: CreatedOrder;
  branchId: string | null;
  initialCustomer?: Customer | null;
  onDone: () => void;
}) {
  // The order passed in is a snapshot from when it was sent; the live copy
  // carries edits (removed lines, new totals), payments already taken, the
  // kitchen's progress, and a cancel/pay by someone else.
  const { data: live } = useOrder(branchId, orderSnapshot.id);
  const queryClient = useQueryClient();
  const { data: menuItems } = useMenuItems(branchId);
  const [exchangeItemId, setExchangeItemId] = useState("");
  const [replacementId, setReplacementId] = useState("");
  const refreshOrder = () => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };
  const resumeHeld = useMutation({
    mutationFn: () => api.post(`/orders/${orderSnapshot.id}/resume?branchId=${branchId}`),
    onSuccess: () => {
      toast.success("Order resumed and sent to the kitchen");
      refreshOrder();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not resume"),
  });
  const splitGuests = useMutation({
    mutationFn: () =>
      api.post<{ orders: { orderNumber: string; guestNumber: number }[] }>(
        `/orders/${orderSnapshot.id}/split-guests?branchId=${branchId}`,
      ),
    onSuccess: (result) => {
      const numbers = result.orders.map((row) => `#${row.orderNumber} (guest ${row.guestNumber})`).join(", ");
      toast.success(numbers ? `Separate bills opened: ${numbers}` : "Split complete");
      refreshOrder();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not split"),
  });
  const exchangeItem = useMutation({
    mutationFn: () =>
      api.post(`/orders/${orderSnapshot.id}/exchange?branchId=${branchId}`, {
        orderItemId: exchangeItemId,
        menuItemId: replacementId,
      }),
    onSuccess: (result) => {
      const exchanged = result as { orderNumber?: string };
      toast.success(
        exchanged.orderNumber
          ? `Exchange opened order #${exchanged.orderNumber}. The old line is back on the guest wallet.`
          : "Item exchanged",
      );
      setExchangeItemId("");
      setReplacementId("");
      refreshOrder();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not exchange"),
  });
  const order: CreatedOrder = live
    ? {
        ...orderSnapshot,
        subtotal: live.subtotal,
        taxAmount: live.taxAmount,
        totalAmount: live.totalAmount,
        status: live.status,
      }
    : orderSnapshot;
  const [method, setMethod] = useState<PaymentMethodDto>("UPI");
  const [employeeDiscount, setEmployeeDiscount] = useState(false);
  const [moveItemId, setMoveItemId] = useState("");
  const [moveTargetId, setMoveTargetId] = useState("");
  const [amountText, setAmountText] = useState("");
  const [payCurrency, setPayCurrency] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [tipAmount, setTipAmount] = useState("0");
  const [pointsToRedeem, setPointsToRedeem] = useState("0");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardBalance, setGiftCardBalance] = useState<number | null>(null);
  const [checkingGiftCard, setCheckingGiftCard] = useState(false);
  const [splitCount, setSplitCount] = useState("1");
  const [splitOn, setSplitOn] = useState(false);
  const [splitLines, setSplitLines] = useState<SplitLine[]>([
    { id: "cash", method: "CASH", amount: "", reference: "" },
    { id: "upi", method: "UPI", amount: "", reference: "" },
  ]);
  const [upiReference, setUpiReference] = useState("");
  const [receiptPhone, setReceiptPhone] = useState(initialCustomer?.phone ?? "");
  const sendDigitalReceipt = useMutation({
    mutationFn: ({
      orderId,
      channel,
      phone,
    }: {
      orderId: string;
      channel: "whatsapp" | "sms";
      phone: string;
    }) =>
      api.post<{ status: string; error?: string | null }>(
        `/orders/${orderId}/receipt/${channel}?branchId=${branchId}`,
        { phone },
      ),
  });
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const checkout = useCheckoutOrder(branchId);
  const { note, clear: clearNote, toast } = useNoteToast();
  const canCancelRole = useCanCancelOrders();
  const { data: me } = useCurrentUser();
  const canEditRole = hasPermission(me?.user, "orders.edit");
  const canDiscount = hasPermission(me?.user, "discounts.apply");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const printUsb = usePrintOrderUsb(branchId);
  const printKot = usePrintKot(branchId);
  const onPrinted = (r: PrintJobResult) =>
    r.unsupportedChars?.length
      ? toast.warning(`Sent, but ${r.unsupportedChars.join(" ")} cannot be printed by this printer's code page. Use browser print for the full text.`)
      : toast.success("Sent to the thermal printer");
  // First print sends only tickets not yet printed. If they already went out
  // (e.g. a double tap or retry) the server refuses to print a duplicate and we
  // offer an explicit, REPRINT-stamped copy instead.
  const printKotNow = (reprint: boolean) =>
    printKot.mutate(
      { orderId: order.id, reprint },
      {
        onSuccess: (r) => {
          onPrinted(r);
          if (reprint) toast.success("Reprint sent — marked REPRINT on paper");
        },
        onError: (err) => {
          if (err instanceof ApiError && err.code === "ALREADY_PRINTED") {
            toast.info("The kitchen ticket was already printed", {
              action: { label: "Print a REPRINT", onClick: () => printKotNow(true) },
            });
            return;
          }
          toast.error(err instanceof ApiError ? err.message : "Could not print to the kitchen printer");
        },
      },
    );
  const [completed, setCompleted] = useState<CheckoutResult | null>(null);
  const { data: settings } = useSettings(branchId);
  const rates = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => api.get<Array<{ currency: string; rateToBase: string | number }>>("/service/rates"),
  });
  const { data: openBills } = useOpenOrders(branchId);
  const payMethods = enabledMethods(settings?.restaurant);
  useEffect(() => {
    if (payMethods.length && !payMethods.includes(method)) {
      setMethod(payMethods[0]);
    }
  }, [payMethods, method]);
  const phoneSeeded = useRef(Boolean(initialCustomer?.phone));
  useEffect(() => {
    if (phoneSeeded.current) return;
    const next = settings?.branch.phone;
    if (!next) return;
    phoneSeeded.current = true;
    setReceiptPhone(next);
  }, [settings?.branch.phone]);

  // What the guest has typed in, as numbers. Once a payment has been taken the
  // server locks the figures, so these stop mattering (and are not sent).
  const adjustments = useMemo(
    () => ({
      discountPercent: Number(discountPercent) || 0,
      tipAmount: Number(tipAmount) || 0,
      loyaltyPointsToRedeem: Math.max(0, Math.floor(Number(pointsToRedeem) || 0)),
      couponCode: appliedCoupon || undefined,
      employeeDiscount: employeeDiscount || undefined,
    }),
    [discountPercent, tipAmount, pointsToRedeem, appliedCoupon, employeeDiscount],
  );
  const settled = useDebounced(adjustments);
  // Once any payment is on the bill the server fixes its figures and refuses
  // further adjustments, so none are sent from then on.
  const hasPayments = (live?.payments.length ?? 0) > 0;

  // The server prices the bill: this is the single source for the figures on
  // screen, on the printed bill, and at checkout.
  const billQuery = useBillPreview(
    branchId,
    order.id,
    hasPayments ? {} : settled,
    order.status === "OPEN",
  );
  const bill: BillPreview | undefined = billQuery.data;
  const locked = (bill?.locked ?? false) || hasPayments;
  const repricing = adjustments !== settled;

  // A coupon is checked when applied, so the bill above only ever sees a valid
  // code (or none) and never drops the happy-hour discount on an error.
  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return setAppliedCoupon("");
    try {
      // Validate this code on its own before adopting it.
      await api.post(`/orders/${order.id}/bill-preview?branchId=${branchId}`, { couponCode: code });
      setAppliedCoupon(code);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not apply coupon");
    }
  };

  const balance = bill?.balanceDue ?? 0;
  const giftCardApplied = giftCardBalance !== null ? round2(Math.min(giftCardBalance, balance)) : 0;
  const remainingDue = round2(balance - giftCardApplied);
  const fx = (rates.data ?? []).find((row) => row.currency === payCurrency);
  const fxRate = fx ? Number(fx.rateToBase) : 0;
  const enteredForeign = parseMoney(amountText);
  const entered =
    payCurrency && fxRate > 0 && enteredForeign != null ? round2(enteredForeign / fxRate) : enteredForeign;
  const plan = planPayment({ remaining: remainingDue, entered, method });
  const splitPlan = planSplitPayments({ remaining: remainingDue, lines: splitLines });
  const upiReferenceMissing =
    !splitOn && method === "UPI" && remainingDue > 0 && upiReference.trim().replace(/\s/g, "").length < 6;
  const paying = splitOn
    ? {
        valid: splitPlan.valid,
        partial: splitPlan.partial,
        change: splitPlan.change,
        applied: round2(splitPlan.payments.reduce((sum, payment) => sum + payment.amount, 0)),
      }
    : {
        valid: plan.valid && !upiReferenceMissing,
        partial: plan.partial,
        change: plan.change,
        applied: plan.applied,
      };
  const split = Math.max(1, Math.floor(Number(splitCount) || 1));

  const checkGiftCard = async () => {
    if (!giftCardCode) return;
    setCheckingGiftCard(true);
    try {
      const card = await lookupGiftCard(branchId, giftCardCode);
      if (!card) {
        toast.error("No gift card found with that code");
        setGiftCardBalance(null);
        return;
      }
      setGiftCardBalance(Number(card.balance));
    } finally {
      setCheckingGiftCard(false);
    }
  };

  // What the QR asks the guest to pay: the amount being recorded now.
  const upiAmount = splitOn
    ? round2(Math.min(splitPlan.upiAmount, remainingDue))
    : plan.valid
      ? plan.applied
      : remainingDue;
  const upiVpa = settings?.restaurant.upiVpa || null;
  const upiName = settings?.restaurant.upiPayeeName || settings?.restaurant.name;
  const demoUpi = false;
  const showUpiQr = remainingDue > 0 && upiAmount > 0 && (splitOn || method === "UPI");
  const upiUri =
    !showUpiQr || !upiVpa
      ? null
      : buildUpiUri({
          vpa: upiVpa,
          name: upiName,
          amount: upiAmount,
          note: `Order ${order.id.slice(-6).toUpperCase()}`,
          ref: order.id,
        });

  // Mirror the QR to the customer-facing screen while UPI is selected, and
  // clear it again if the cashier switches method.
  useEffect(() => {
    if (completed) return;
    if (upiUri) {
      publishDisplay({ kind: "upi", total: upiAmount, uri: upiUri, payee: upiName || "" });
    }
  }, [upiUri, upiAmount, upiName, completed]);

  // One id per distinct attempt: a retry after a dropped connection (same
  // payload) reuses it, so the server records the payment once.
  const attempt = useRef<{ key: string; id: string } | null>(null);
  const requestIdFor = (payload: unknown) => {
    const key = JSON.stringify(payload);
    if (attempt.current?.key !== key) {
      attempt.current = { key, id: crypto.randomUUID() };
    }
    return attempt.current.id;
  };

  const handleCheckout = () => {
    if (!bill || repricing) return;
    const payments = splitOn
      ? splitPlan.payments.map((payment) => ({
          method: payment.method as PaymentMethodDto,
          amount: payment.amount,
          ...(payment.tendered ? { tendered: payment.tendered } : {}),
          ...(payment.reference ? { reference: payment.reference } : {}),
        }))
      : plan.applied > 0
        ? [
            {
              method,
              amount: plan.applied,
              ...(plan.tendered ? { tendered: plan.tendered } : {}),
              ...(method === "UPI"
                ? { reference: upiReference.replace(/\s/g, "") }
                : payCurrency && fxRate > 0
                  ? { reference: `${payCurrency} ${amountText} @ ${fxRate}` }
                  : {}),
            },
          ]
        : [];
    const dto = {
      customerId: customer?.id,
      ...(locked ? {} : settled),
      giftCardCode: giftCardBalance !== null ? giftCardCode : undefined,
      payments,
      allowPartial: paying.partial || undefined,
    };
    checkout.mutate(
      { orderId: order.id, dto: { ...dto, requestId: requestIdFor(dto) } },
      {
        onSuccess: (result) => {
          attempt.current = null;
          setAmountText("");
          if (result.settlement.fullyPaid) {
            setCompleted(result);
            publishDisplay({ kind: "paid", total: Number(result.totalAmount), method });
            playPaymentReceived(formatCurrency(result.totalAmount));
            toast.success("Payment recorded");
          } else {
            toast.success(
              `Part payment of ${formatCurrency(result.settlement.amountPaid)} recorded — ${formatCurrency(result.settlement.balanceDue)} still due`,
            );
          }
        },
        onError: (err) => {
          if (err instanceof ApiError || !branchId) {
            toast.error(err instanceof ApiError ? err.message : "Checkout failed");
            return;
          }
          const requestId = requestIdFor(dto);
          const body = { ...dto, requestId };
          if (!readQueue("pos-pay-queue").some((item) => item.id === requestId)) {
            enqueueRequest("pos-pay-queue", {
              id: requestId,
              path: `/orders/${order.id}/checkout?branchId=${branchId}`,
              body,
              createdAt: new Date().toISOString(),
            });
          }
          void printLocalSlip(
            "Saved on this register",
            "This copy prints here. The payment is recorded when the server is back.",
            String(payments.reduce((sum, row) => sum + row.amount, 0) || order.totalAmount),
          );
          toast.success("Payment saved on this register. It will be recorded when the server is back.");
        },
      },
    );
  };

  const printLocalSlip = (title: string, footer: string, amount: string) => {
    const lines = (live?.items ?? []).map((item) => ({
      name: item.nameSnapshot,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    }));
    return printTicket({
      restaurantName: settings?.restaurant.name ?? "Receipt",
      orderNumber: order.orderNumber,
      createdAt: live?.createdAt ?? new Date().toISOString(),
      serviceLabel: (live?.type ?? "BILL").replaceAll("_", " "),
      items: lines.length > 0 ? lines : [{ name: "Bill", quantity: 1, lineTotal: amount }],
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      totalAmount: amount,
      taxLabel: settings?.branch.taxLabel ?? "Tax",
      taxMode: settings?.branch.taxMode === "EXCLUSIVE" ? "EXCLUSIVE" : "INCLUSIVE",
      locale: "en-IN",
      currency: settings?.restaurant.currency ?? "INR",
      paid: order.status === "PAID",
      labels: {
        order: title,
        total: "Total",
        taxIncluded: "Included",
        paid: "PAID RECEIPT",
        notPaid: "NOT PAID RECEIPT",
        payAtCounter: footer,
      },
    });
  };
  const printBill = () => {
    if (!branchId) return;
    const localCopy = () =>
      printLocalSlip(
        "Copy on this register",
        "Printed here because the server copy was not available.",
        order.totalAmount,
      );
    const params = new URLSearchParams({ branchId, t: String(Date.now()) });
    for (const [key, value] of Object.entries(locked ? {} : settled)) {
      if (value !== undefined && value !== "" && value !== 0) params.set(key, String(value));
    }
    void fetch(`/api/v1/orders/${order.id}/receipt?${params}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("unavailable");
        openReceiptPrint(order.id, branchId, locked ? {} : settled);
      })
      .catch(() => {
        void localCopy();
        toast.success("Printed the copy kept on this register.");
      });
  };
  const printBillThermal = () =>
    printUsb.mutate(
      { orderId: order.id, adjustments: locked ? {} : settled },
      {
        onSuccess: onPrinted,
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not print to the thermal printer"),
      },
    );

  const receiptPhoneValue = receiptPhone || live?.customer?.phone || "";
  const receiptEmail = settings?.restaurant.receiptEmail?.trim() || "";
  const receiptBody = receiptMessage({
    restaurant: settings?.restaurant.name ?? "ABA",
    orderNumber: order.orderNumber,
    lines: (live?.items ?? []).map((item) => ({
      name: item.nameSnapshot,
      quantity: item.quantity,
      total: formatCurrency(item.lineTotal),
    })),
    total: formatCurrency(completed?.totalAmount ?? order.totalAmount),
    payments: (completed?.payments ?? live?.payments ?? []).map((payment) => ({
      method: payment.method,
      amount: formatCurrency(payment.amount),
    })),
  });

  if (completed) {
    const { settlement } = completed;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <StatusNote note={note} onClear={clearNote} className="w-full text-left" />
        <CheckCircle2 className="h-10 w-10 text-success" />
        <p className="text-lg font-semibold text-foreground">
          Order #{order.orderNumber} paid
        </p>
        <p className="text-2xl font-semibold tabular-nums text-foreground">
          {formatCurrency(completed.totalAmount)}
        </p>
        {settlement.changeDue > 0 && (
          <p className="rounded-lg bg-success/10 px-4 py-2 text-lg font-semibold tabular-nums text-success">
            Change due {formatCurrency(settlement.changeDue)}
          </p>
        )}
        {Number(completed.loyaltyDiscountAmount) > 0 && (
          <p className="text-xs text-muted-foreground">
            {completed.loyaltyPointsRedeemed} points redeemed
          </p>
        )}
        <div className="mt-4 flex w-full max-w-sm flex-col gap-2">
          {(settings?.restaurant.receiptWhatsApp !== false ||
            settings?.restaurant.waCloudEnabled ||
            settings?.restaurant.smsEnabled) && (
            <>
          <Label htmlFor="receipt-phone">Mobile for receipt</Label>
          <Input
            id="receipt-phone"
            inputMode="tel"
            value={receiptPhoneValue}
            onChange={(e) => setReceiptPhone(e.target.value)}
            placeholder="Customer mobile"
          />
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={!whatsAppHref(receiptPhoneValue, receiptBody)}
            onClick={() => {
              const href = whatsAppHref(receiptPhoneValue, receiptBody);
              if (href) window.open(href, "_blank", "noopener,noreferrer");
            }}
          >
            Open WhatsApp
          </Button>
          {settings?.restaurant.waCloudEnabled && (
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={!receiptPhoneValue || sendDigitalReceipt.isPending}
              onClick={() =>
                sendDigitalReceipt.mutate(
                  { orderId: completed.id, channel: "whatsapp", phone: receiptPhoneValue },
                  {
                    onSuccess: (row) =>
                      row.status === "SENT"
                        ? toast.success("WhatsApp receipt sent")
                        : toast.error(row.error || "WhatsApp send queued or failed"),
                    onError: (err) =>
                      toast.error(err instanceof ApiError ? err.message : "Could not send WhatsApp"),
                  },
                )
              }
            >
              Send via WhatsApp Cloud
            </Button>
          )}
          {settings?.restaurant.smsEnabled && (
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={!receiptPhoneValue || sendDigitalReceipt.isPending}
              onClick={() =>
                sendDigitalReceipt.mutate(
                  { orderId: completed.id, channel: "sms", phone: receiptPhoneValue },
                  {
                    onSuccess: (row) =>
                      row.status === "SENT"
                        ? toast.success("SMS receipt sent")
                        : toast.error(row.error || "SMS send queued or failed"),
                    onError: (err) =>
                      toast.error(err instanceof ApiError ? err.message : "Could not send SMS"),
                  },
                )
              }
            >
              Send SMS receipt
            </Button>
          )}
            </>
          )}
          {settings?.restaurant.receiptEmailEnabled !== false && (
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={!receiptEmail}
            onClick={() => {
              const href = `mailto:${receiptEmail}?subject=${encodeURIComponent(`Receipt ${order.orderNumber}`)}&body=${encodeURIComponent(receiptBody)}`;
              window.location.href = href;
            }}
          >
            Email receipt
          </Button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {settings?.restaurant.receiptPrint !== false && (
          <Button
            variant="outline"
            className="h-11"
            onClick={() => branchId && openReceiptPrint(completed.id, branchId)}
          >
            Print receipt (browser)
          </Button>
          )}
          <Button
            variant="outline"
            className="h-11"
            disabled={printUsb.isPending}
            onClick={() =>
              printUsb.mutate({ orderId: completed.id, drawer: completed.payments?.some((p) => p.method === "CASH") }, {
                onSuccess: onPrinted,
                onError: (err) =>
                  toast.error(err instanceof ApiError ? err.message : "Could not print to the thermal printer"),
              })
            }
          >
            {printUsb.isPending ? "Printing…" : "Thermal receipt"}
          </Button>
          <Button className="h-11" onClick={onDone}>New order</Button>
        </div>
      </div>
    );
  }

  // Someone else (another terminal) already closed this bill.
  if (order.status === "CANCELLED" || (order.status === "PAID" && !completed)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <StatusNote note={note} onClear={clearNote} className="w-full text-left" />
        <p className="text-sm font-medium text-foreground">
          Order #{order.orderNumber} was {order.status === "CANCELLED" ? "cancelled" : "already paid"}
        </p>
        <p className="text-xs text-muted-foreground">
          {order.status === "CANCELLED"
            ? "The kitchen tickets were withdrawn and the table is free again. The order stays in History."
            : "Nothing more to do here."}
        </p>
        <Button className="h-11" onClick={onDone}>Done</Button>
      </div>
    );
  }

  const kitchen = live ? kitchenProgress(live.kots.map((k) => k.status)) : null;
  const paidSoFar = live?.payments ?? [];
  const partialLabel = `Record partial payment · ${formatCurrency(paying.applied)}`;

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto">
      <StatusNote note={note} onClear={clearNote} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 shrink-0 text-muted-foreground"
          onClick={onDone}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex flex-wrap justify-end gap-2">
          {canEditRole && !locked && (
            <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit bill
            </Button>
          )}
          {canCancelRole && !locked && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setCancelOpen(true)}
            >
              Cancel order
            </Button>
          )}
        </div>
        <CancelOrderDialog
          branchId={branchId}
          orderId={order.id}
          orderNumber={order.orderNumber}
          open={cancelOpen}
          onOpenChange={setCancelOpen}
        />
        <EditBillDialog branchId={branchId} orderId={order.id} open={editOpen} onOpenChange={setEditOpen} />
      </div>

      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Order #{order.orderNumber} sent to kitchen</p>
            {kitchen && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <ChefHat className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                {KITCHEN_LABEL[kitchen]}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => branchId && openKotPrint(order.id, branchId)}
          >
            <Printer className="h-4 w-4" />
            KOT (browser)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={printKot.isPending}
            onClick={() => printKotNow(false)}
          >
            <Printer className="h-4 w-4" />
            {printKot.isPending ? "Printing…" : "KOT (thermal)"}
          </Button>
          </div>
        </div>
        {!locked && (
          <p className="mt-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
            No need to pay right now — tap <span className="font-medium text-foreground">Back</span> to
            help another table and come bill this one later from here or the Tables page.
          </p>
        )}
      </div>

      {paidSoFar.length > 0 && (
        <div className="rounded-xl border border-border px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">Payments so far</p>
          <ul className="mt-1 flex flex-col gap-0.5 text-sm">
            {paidSoFar.map((p) => (
              <li key={p.id} className="flex justify-between tabular-nums">
                <span>{p.method}</span>
                <span>{formatCurrency(p.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted-foreground">
            Discount, tip and points are locked until this bill is settled.
          </p>
        </div>
      )}

      <CustomerPicker branchId={branchId} customer={customer} onSelect={setCustomer} />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10"
          disabled={!customer || !branchId}
          onClick={async () => {
            try {
              const last = await api.get<{
                items: { menuItemId: string; quantity: number; modifiers: { modifierId?: string }[] }[];
              }>(`/orders/last-for-customer?branchId=${branchId}&customerId=${customer?.id}`);
              await api.post(`/orders/${order.id}/items?branchId=${branchId}`, {
                items: last.items.map((item) => ({
                  menuItemId: item.menuItemId,
                  quantity: item.quantity,
                  modifierIds: item.modifiers
                    .map((mod) => mod.modifierId)
                    .filter((id): id is string => Boolean(id)),
                })),
              });
              toast.success("Last order added to this bill");
              refreshOrder();
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : "No previous order to repeat");
            }
          }}
        >
          Repeat last order
        </Button>
      </div>
      {Number(settings?.restaurant.employeeDiscountPercent ?? 0) > 0 && (
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
          Employee discount ({settings?.restaurant.employeeDiscountPercent}%)
          <input
            type="checkbox"
            checked={employeeDiscount}
            disabled={locked || !canDiscount}
            onChange={(e) => setEmployeeDiscount(e.target.checked)}
          />
        </label>
      )}
      {live?.items && live.items.length > 1 && (openBills?.length ?? 0) > 1 && (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <Label>Move a line to another open bill</Label>
          <select
            className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
            value={moveItemId}
            onChange={(e) => setMoveItemId(e.target.value)}
            aria-label="Line to move"
          >
            <option value="">Choose a line</option>
            {live.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nameSnapshot}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
            value={moveTargetId}
            onChange={(e) => setMoveTargetId(e.target.value)}
            aria-label="Target bill"
          >
            <option value="">Choose a bill</option>
            {openBills
              ?.filter((bill) => bill.id !== order.id)
              .map((bill) => (
                <option key={bill.id} value={bill.id}>
                  #{bill.orderNumber}
                </option>
              ))}
          </select>
          <Button
            type="button"
            variant="outline"
            disabled={!moveItemId || !moveTargetId}
            onClick={async () => {
              try {
                await api.post(`/orders/${order.id}/move-item?branchId=${branchId}`, {
                  orderItemId: moveItemId,
                  targetOrderId: moveTargetId,
                });
                toast.success("Line moved");
                setMoveItemId("");
                setMoveTargetId("");
                refreshOrder();
              } catch (err) {
                toast.error(err instanceof ApiError ? err.message : "Could not move the line");
              }
            }}
          >
            Move line
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="discount">Discount %</Label>
          <Input
            id="discount"
            type="number"
            min="0"
            max="100"
            className="h-11"
            value={discountPercent}
            disabled={locked || !canDiscount}
            onChange={(e) => setDiscountPercent(e.target.value)}
          />
          {!canDiscount && (
            <p className="text-[11px] text-muted-foreground">Your role cannot apply discounts.</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tip">Tip</Label>
          <Input
            id="tip"
            type="number"
            min="0"
            className="h-11"
            value={tipAmount}
            disabled={locked}
            onChange={(e) => setTipAmount(e.target.value)}
          />
        </div>
      </div>

      {customer && customer.loyaltyPoints > 0 && !locked && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="points">Redeem loyalty points</Label>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() =>
                setPointsToRedeem(String(Math.min(customer.loyaltyPoints, Math.floor(bill?.totalDue ?? 0))))
              }
            >
              Max ({customer.loyaltyPoints} available)
            </button>
          </div>
          <Input
            id="points"
            type="number"
            min="0"
            max={customer.loyaltyPoints}
            className="h-11"
            value={pointsToRedeem}
            onChange={(e) => setPointsToRedeem(e.target.value)}
          />
        </div>
      )}

      {canDiscount && !locked && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="coupon">Coupon code (optional)</Label>
          <div className="flex gap-2">
            <Input
              id="coupon"
              className="h-11"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="e.g. SAVE10"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={!couponInput.trim() && !appliedCoupon}
              onClick={applyCoupon}
            >
              Apply
            </Button>
          </div>
        </div>
      )}

      {!locked && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="gift-card">Gift card code (optional)</Label>
          <div className="flex gap-2">
            <Input
              id="gift-card"
              className="h-11"
              value={giftCardCode}
              onChange={(e) => {
                setGiftCardCode(e.target.value);
                setGiftCardBalance(null);
              }}
              placeholder="e.g. 8A7B629E8EEA"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={!giftCardCode || checkingGiftCard}
              onClick={checkGiftCard}
            >
              {checkingGiftCard ? "…" : "Check"}
            </Button>
          </div>
          {giftCardBalance !== null && (
            <p className="text-xs text-success">
              Balance {formatCurrency(giftCardBalance)} — applying {formatCurrency(giftCardApplied)}
            </p>
          )}
        </div>
      )}

      {billQuery.isError && !bill ? (
        <QueryError
          error={billQuery.error}
          what="the bill"
          onRetry={() => void billQuery.refetch()}
          retrying={billQuery.isFetching}
        />
      ) : (
        <>
          {remainingDue > 0 && !splitOn && (
            <div className="flex flex-col gap-2">
              <Label>Payment method</Label>
              {payMethods.length === 0 ? (
                <p className="text-sm text-muted-foreground">Turn on a payment method in Settings.</p>
              ) : (
                <PaymentMethodButtons methods={payMethods} value={method} onChange={setMethod} />
              )}
            </div>
          )}

          {remainingDue > 0 && !splitOn && (rates.data?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="pay-currency">Currency</Label>
              <select id="pay-currency" className="h-10 rounded-md border border-input bg-background px-2" value={payCurrency} onChange={(e) => setPayCurrency(e.target.value)}>
                <option value="">{settings?.restaurant.currency ?? "Restaurant currency"}</option>
                {(rates.data ?? []).map((row) => (
                  <option key={row.currency} value={row.currency}>{row.currency} · {String(row.rateToBase)} per 1 {settings?.restaurant.currency ?? "base"}</option>
                ))}
              </select>
              {payCurrency && fxRate > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ask for {(remainingDue * fxRate).toFixed(2)} {payCurrency}. That is {formatCurrency(remainingDue, settings?.restaurant.currency ?? "INR")} on the bill.
                </p>
              ) : null}
            </div>
          )}

          {remainingDue > 0 && !splitOn && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">{method === "CASH" ? "Cash received" : "Amount to pay now"}{payCurrency ? ` (${payCurrency})` : ""}</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                className="h-12 text-lg tabular-nums"
                value={amountText}
                placeholder={String(remainingDue)}
                onChange={(e) => setAmountText(e.target.value)}
              />
              {plan.valid && plan.change > 0 && (
                <p className="rounded-lg bg-success/10 px-3 py-2 text-base font-semibold tabular-nums text-success" role="status">
                  Change due {formatCurrency(plan.change)}
                </p>
              )}
              {plan.valid && plan.partial && (
                <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning" role="status">
                  Part payment — {formatCurrency(plan.balanceAfter)} will stay due and the table stays open.
                </p>
              )}
              {plan.clamped && (
                <p className="text-xs text-muted-foreground" role="status">
                  {method} can only pay the balance ({formatCurrency(remainingDue)}); only that will be charged.
                </p>
              )}
            </div>
          )}

          {remainingDue > 0 && !splitOn && method === "UPI" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="upi-ref">UPI reference</Label>
              <Input
                id="upi-ref"
                value={upiReference}
                onChange={(e) => setUpiReference(e.target.value)}
                placeholder="From GPay, PhonePe, or the soundbox"
                maxLength={35}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                The bill records this reference. A bank does not confirm the payment on its own.
              </p>
            </div>
          )}

          {remainingDue > 0 && (
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => setSplitOn((on) => !on)}
            >
              {splitOn ? "Use one payment method" : "Cash and UPI on this bill"}
            </Button>
          )}

          {remainingDue > 0 && splitOn && (
            <div className="flex flex-col gap-3">
              {splitLines.map((line) => (
                <div key={line.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                  <PaymentMethodButtons
                    methods={payMethods}
                    value={line.method}
                    onChange={(next) =>
                      setSplitLines((rows) =>
                        rows.map((row) => (row.id === line.id ? { ...row, method: next } : row)),
                      )
                    }
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    className="h-11 tabular-nums"
                    value={line.amount}
                    placeholder={line.method === "CASH" ? "Cash received" : "Amount"}
                    aria-label={`${line.method} amount`}
                    onChange={(e) =>
                      setSplitLines((rows) =>
                        rows.map((row) => (row.id === line.id ? { ...row, amount: e.target.value } : row)),
                      )
                    }
                  />
                  {line.method === "UPI" && (
                    <Input
                      value={line.reference}
                      maxLength={35}
                      placeholder="UPI reference"
                      aria-label="UPI reference"
                      onChange={(e) =>
                        setSplitLines((rows) =>
                          rows.map((row) => (row.id === line.id ? { ...row, reference: e.target.value } : row)),
                        )
                      }
                    />
                  )}
                </div>
              ))}
              {splitPlan.reason && <p className="text-xs text-muted-foreground">{splitPlan.reason}</p>}
              {splitPlan.valid && splitPlan.change > 0 && (
                <p className="rounded-lg bg-success/10 px-3 py-2 text-base font-semibold tabular-nums text-success">
                  Change due {formatCurrency(splitPlan.change)}
                </p>
              )}
              {splitPlan.valid && splitPlan.partial && (
                <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
                  Part payment — {formatCurrency(splitPlan.balanceAfter)} will stay due.
                </p>
              )}
            </div>
          )}

          {showUpiQr && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-4">
              {upiUri ? (
                <>
                  <QRCodeSVG value={upiUri} size={176} level="M" marginSize={1} />
                  <p className="text-xs font-medium text-[#17251d]">
                    {demoUpi
                      ? `Demo QR · scanning does not move money · ${formatCurrency(upiAmount)}`
                      : `Scan with any UPI app · ${formatCurrency(upiAmount)} pre-filled`}
                  </p>
                  <p className="text-[11px] text-neutral-500">Also shown on the customer display</p>
                </>
              ) : (
                <p className="text-center text-xs text-neutral-600">
                  No UPI id set yet. <Link href="/settings" className="font-medium underline">Add your UPI id in Settings → Restaurant</Link> to show a payment QR here.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <Label htmlFor="split" className="text-xs text-muted-foreground">
              Split between
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="split"
                type="number"
                min="1"
                value={splitCount}
                onChange={(e) => setSplitCount(e.target.value)}
                className="h-8 w-16 text-center"
              />
              <span className="text-xs text-muted-foreground">guests</span>
            </div>
          </div>
          {split > 1 && bill && (
            <p className="-mt-2 text-center text-xs text-muted-foreground">
              {formatCurrency(round2(balance / split))} each — enter each guest&apos;s share as a part
              payment, or collect separately and complete payment once for the whole table.
            </p>
          )}
        </>
      )}

      <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
        {live?.heldAt && (
          <Button type="button" variant="outline" disabled={resumeHeld.isPending} onClick={() => resumeHeld.mutate()}>
            Resume and send to kitchen
          </Button>
        )}
        {live && live.items.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm">
            <p className="font-medium text-foreground">Each guest</p>
            {Array.from(
              live.items.reduce((map, item) => {
                const guest = item.guestNumber ?? 1;
                map.set(guest, (map.get(guest) ?? 0) + Number(item.lineTotal));
                return map;
              }, new Map<number, number>()),
            )
              .sort((a, b) => a[0] - b[0])
              .map(([guest, total]) => (
                <div key={guest} className="flex justify-between text-muted-foreground">
                  <span>Guest {guest}</span>
                  <span className="tabular-nums text-foreground">{formatCurrency(total)}</span>
                </div>
              ))}
            <Button type="button" variant="outline" size="sm" disabled={splitGuests.isPending || live.status !== "OPEN"} onClick={() => splitGuests.mutate()}>
              Separate bill per guest
            </Button>
            <div className="grid gap-2 sm:grid-cols-2">
              <select aria-label="Line to exchange" value={exchangeItemId} onChange={(e) => setExchangeItemId(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
                <option value="">Line to exchange</option>
                {live.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nameSnapshot}
                    {item.hsnCode ? ` · ${item.hsnCode}` : ""}
                  </option>
                ))}
              </select>
              <select aria-label="Replacement dish" value={replacementId} onChange={(e) => setReplacementId(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
                <option value="">Replacement dish</option>
                {(menuItems ?? []).filter((item) => item.isActive).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!exchangeItemId || !replacementId || exchangeItem.isPending}
              onClick={() => exchangeItem.mutate()}
            >
              Exchange item
            </Button>
          </div>
        )}
        <BillSummary bill={bill} giftCardApplied={giftCardApplied} pending={repricing || billQuery.isFetching} />

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={!bill}
            onClick={printBill}
            title="Prints the bill for the guest. Nothing is charged and the table stays open."
          >
            <Printer className="h-4 w-4" />
            Print bill
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={!bill || printUsb.isPending}
            onClick={printBillThermal}
            title="Prints the bill on the thermal printer. Nothing is charged and the cash drawer stays shut."
          >
            <Printer className="h-4 w-4" />
            {printUsb.isPending ? "Printing…" : "Print bill (thermal)"}
          </Button>
        </div>

        <Button
          className="h-12 text-base"
          disabled={checkout.isPending || !bill || repricing || !paying.valid}
          onClick={handleCheckout}
        >
          {checkout.isPending
            ? "Processing…"
            : paying.partial
              ? partialLabel
              : paying.change > 0
                ? `Complete payment · change ${formatCurrency(paying.change)}`
                : "Complete payment"}
        </Button>
      </div>
    </div>
  );
}

// The settlement summary: every figure on the printed bill, in the same order.
function BillSummary({
  bill,
  giftCardApplied,
  pending,
}: {
  bill: BillPreview | undefined;
  giftCardApplied: number;
  pending: boolean;
}) {
  if (!bill) {
    return <p className="text-sm text-muted-foreground">Pricing the bill…</p>;
  }
  const source = bill.couponCode
    ? `coupon ${bill.couponCode}`
    : bill.promotionName
      ? bill.promotionName
      : bill.discountType === "FIXED"
        ? "flat discount"
        : null;
  return (
    <div className={pending ? "opacity-70" : undefined} aria-busy={pending}>
      <dl className="flex flex-col gap-1 text-sm">
        <Row label="Subtotal" value={formatCurrency(bill.subtotal)} />
        {bill.discountAmount > 0 && (
          <Row
            label={`Discount${source ? ` (${source})` : ""}`}
            value={`− ${discountSummary(bill.discountPercent, bill.discountAmount, formatCurrency)}`}
            accent
          />
        )}
        {(bill.serviceChargeAmount ?? 0) > 0 && (
          <Row label="Service charge" value={formatCurrency(bill.serviceChargeAmount ?? 0)} />
        )}
        <Row
          label={bill.interstate ? "IGST (included)" : "Tax (included)"}
          value={formatCurrency(bill.taxAmount)}
          muted
        />
        {bill.loyaltyDiscountAmount > 0 && (
          <Row
            label={`Loyalty (${bill.loyaltyPointsRedeemed} pts)`}
            value={`− ${formatCurrency(bill.loyaltyDiscountAmount)}`}
            accent
          />
        )}
        {bill.tipAmount > 0 && <Row label="Tip" value={formatCurrency(bill.tipAmount)} />}
        {bill.deliveryFee > 0 && <Row label="Delivery fee" value={formatCurrency(bill.deliveryFee)} />}
      </dl>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        <span className="text-sm font-medium text-foreground">Total due</span>
        <span className="text-lg font-semibold tabular-nums text-foreground">{formatCurrency(bill.totalDue)}</span>
      </div>
      {bill.amountPaid > 0 && (
        <dl className="mt-1 flex flex-col gap-1 text-sm">
          <Row label="Paid so far" value={formatCurrency(bill.amountPaid)} />
        </dl>
      )}
      {giftCardApplied > 0 && <Row label="Gift card" value={`− ${formatCurrency(giftCardApplied)}`} accent />}
      <div className="mt-1 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Balance due</span>
        <span className="text-base font-semibold tabular-nums text-foreground">
          {formatCurrency(Math.max(round2(bill.balanceDue - giftCardApplied), 0))}
        </span>
      </div>
    </div>
  );
}

function Row({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={muted ? "text-xs text-muted-foreground" : "text-muted-foreground"}>{label}</dt>
      <dd className={`tabular-nums ${accent ? "text-success" : muted ? "text-xs text-muted-foreground" : "text-foreground"}`}>
        {value}
      </dd>
    </div>
  );
}
