"use client";

import { Search, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { use, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { GuestCartBar } from "@/components/order/guest-cart-bar";
import { GuestDishCard } from "@/components/order/guest-dish-card";
import { GuestOrderStatus } from "@/components/order/guest-order-status";
import { GuestPlaced } from "@/components/order/guest-placed";
import type {
  CartLine,
  PublicMenuItem,
  PublicMenuResponse,
  PublicStatus,
} from "@/components/order/guest-types";
import { GuestWelcome } from "@/components/order/guest-welcome";
import { TableReorder } from "@/components/order/table-reorder";
import { ModifierPickerDialog } from "@/components/pos/modifier-picker-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n/context";
import { api, ApiError } from "@/lib/api";
import { playSuccessChime, vibrateSuccess } from "@/lib/celebrate";
import { formatCurrency } from "@/lib/format";
import { enqueueRequest, flushQueue } from "@/lib/offline-queue";
import { cn } from "@/lib/utils";
import { uuid } from "@/lib/uuid";

export default function PublicMenuPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = use(params);
  const { t } = useI18n();
  const nameStorageKey = `qr-guest-name:${qrToken}`;
  const phoneStorageKey = `qr-guest-phone:${qrToken}`;
  const queueKey = `table-queue:${qrToken}`;
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pickerItem, setPickerItem] = useState<PublicMenuItem | null>(null);
  const queryClient = useQueryClient();
  const [placed, setPlaced] = useState<{ orderNumber: string } | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  useEffect(() => {
    const saved = sessionStorage.getItem(nameStorageKey);
    const savedPhone = sessionStorage.getItem(phoneStorageKey);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setGuestName(saved);
    if (savedPhone) setGuestPhone(savedPhone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (placed) {
      vibrateSuccess();
      playSuccessChime();
    }
  }, [placed]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-menu", qrToken],
    queryFn: () => api.get<PublicMenuResponse>(`/public/menu/${qrToken}`),
    retry: false,
  });

  useEffect(() => {
    if (!activeCategory && data?.categories[0]?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveCategory(data.categories[0].id);
    }
  }, [data, activeCategory]);

  const { data: status } = useQuery({
    queryKey: ["public-status", qrToken],
    queryFn: () => api.get<PublicStatus>(`/public/menu/${qrToken}/status`),
    refetchInterval: 8000,
    enabled: !!data && !!guestName,
  });

  useEffect(() => {
    const flush = () => {
      void flushQueue(queueKey, async (item) => {
        await api.post(`/public/menu/${qrToken}/order`, item.body);
      }).then(() => queryClient.invalidateQueries({ queryKey: ["public-status", qrToken] }));
    };
    window.addEventListener("online", flush);
    if (navigator.onLine) flush();
    return () => window.removeEventListener("online", flush);
  }, [qrToken, queueKey, queryClient]);

  const requestService = useMutation({
    mutationFn: (type: "WAITER" | "BILL") => api.post(`/public/menu/${qrToken}/request`, { type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["public-status", qrToken] }),
  });

  const placeOrder = useMutation({
    mutationFn: () => {
      const requestId = uuid();
      const body = {
        guestName,
        ...(guestPhone.replace(/\D/g, "").length >= 8
          ? { phone: guestPhone.replace(/\D/g, "") }
          : {}),
        requestId,
        items: cart.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
          modifierIds: l.modifierIds,
          ...(l.sizeId ? { sizeId: l.sizeId } : {}),
        })),
      };
      return api.post<{ orderNumber: string }>(`/public/menu/${qrToken}/order`, body).catch((err) => {
        if (!(err instanceof ApiError)) {
          enqueueRequest(queueKey, {
            id: requestId,
            path: `/public/menu/${qrToken}/order`,
            body,
            createdAt: new Date().toISOString(),
          });
          return { orderNumber: "QUEUED" };
        }
        throw err;
      });
    },
    onSuccess: (order) => {
      setPlaced(order);
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ["public-status", qrToken] });
    },
  });

  const confirmName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    sessionStorage.setItem(nameStorageKey, trimmed);
    setGuestName(trimmed);
    const phone = phoneDraft.trim();
    if (phone) {
      sessionStorage.setItem(phoneStorageKey, phone);
      setGuestPhone(phone);
    }
  };

  const cartCount = cart.reduce((sum, l) => sum + l.quantity, 0);
  const quantityOfItem = (itemId: string) =>
    cart.filter((l) => l.menuItemId === itemId).reduce((sum, l) => sum + l.quantity, 0);

  const addLine = (
    item: PublicMenuItem,
    modifierIds: string[],
    optionLabel: string,
    extra: number,
    sizeId?: string,
  ) => {
    const size = item.sizes?.find((row) => row.id === sizeId);
    const key = `${item.id}:${[...modifierIds].sort().join(",")}:${sizeId ?? ""}`;
    const label = [item.name, size?.name, optionLabel].filter(Boolean).join(" · ");
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
      return [
        ...prev,
        {
          key,
          menuItemId: item.id,
          modifierIds,
          sizeId,
          label,
          unitPrice: (size ? Number(size.price) : Number(item.price)) + extra,
          quantity: 1,
        },
      ];
    });
  };

  const handleAdd = (item: PublicMenuItem) => {
    if (item.modifierGroups.length > 0 || (item.sizes?.length ?? 0) > 0) setPickerItem(item);
    else addLine(item, [], "", 0);
  };

  const removeOne = (itemId: string) =>
    setCart((prev) => {
      const idx = [...prev].reverse().findIndex((l) => l.menuItemId === itemId);
      if (idx < 0) return prev;
      const at = prev.length - 1 - idx;
      return prev
        .map((l, i) => (i === at ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0);
    });

  const changeQty = (key: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );

  const visibleCategories = useMemo(() => {
    if (!data) return [];
    if (!deferredQuery) return data.categories;
    return data.categories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.name.toLowerCase().includes(deferredQuery) ||
            (item.description ?? "").toLowerCase().includes(deferredQuery),
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [data, deferredQuery]);

  if (error) {
    const unrecognized =
      error instanceof ApiError && (error.status === 404 || /not recognized/i.test(error.message));
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary">
          <UtensilsCrossed className="size-6 text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold text-foreground">
          {unrecognized ? t("order.qrNotRecognized") : t("order.menuUnavailable")}
        </p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {error instanceof ApiError ? error.message : t("order.askStaffForHelp")}
        </p>
      </div>
    );
  }

  if (placed) {
    return (
      <GuestPlaced
        guestName={guestName}
        branchName={data?.branchName}
        orderNumber={placed.orderNumber}
        onMore={() => setPlaced(null)}
      />
    );
  }

  if (!guestName) {
    return (
      <GuestWelcome
        branchName={data?.branchName}
        tableName={data?.tableName}
        loading={isLoading}
        nameDraft={nameDraft}
        onNameDraft={setNameDraft}
        phoneDraft={phoneDraft}
        onPhoneDraft={setPhoneDraft}
        onContinue={confirmName}
      />
    );
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(70%_80%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]"
      />

      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-start justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
          <div className="min-w-0">
            {isLoading ? (
              <Skeleton className="h-7 w-40" />
            ) : (
              <>
                <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase">
                  {data?.tableName}
                </p>
                <h1 className="mt-0.5 truncate text-xl font-semibold tracking-tight text-foreground">
                  {data?.branchName}
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground">Ordering as {guestName}</p>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/guest/${qrToken}`}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              Profile
            </Link>
            <LanguageSwitcher compact />
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 pb-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu"
              className="h-11 rounded-xl border-border/80 bg-card pl-9 shadow-none"
              aria-label="Search the menu"
            />
          </label>
        </div>

        {!deferredQuery && data && data.categories.length > 0 ? (
          <div className="mx-auto max-w-lg overflow-hidden px-4 pb-3">
            <div
              role="tablist"
              aria-label="Categories"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              className="flex gap-1.5 overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden"
            >
              {data.categories.map((category) => {
                const selected = category.id === activeCategory;
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      setActiveCategory(category.id);
                      document.getElementById(`cat-${category.id}`)?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className={cn(
                      "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </header>

      <main className="relative mx-auto max-w-lg px-4 pt-4">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <TableReorder
              qrToken={qrToken}
              onAdd={(dish) => {
                const item = data?.categories
                  .flatMap((category) => category.items)
                  .find((row) => row.id === dish.menuItemId);
                if (!item) return;
                for (let n = 0; n < Math.max(1, dish.quantity || 1); n += 1) {
                  addLine(item, dish.modifierIds, "", 0);
                }
              }}
            />

            {visibleCategories.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No dishes match that search.</p>
            ) : (
              visibleCategories.map((category) => (
                <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-44">
                  <h2 className="mb-1 text-sm font-semibold tracking-tight text-foreground">
                    {category.name}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {category.items.length}
                    </span>
                  </h2>
                  <div className="divide-y divide-border/80 border-t border-border/80">
                    {category.items.map((item) => (
                      <GuestDishCard
                        key={item.id}
                        item={item}
                        quantity={quantityOfItem(item.id)}
                        addLabel={t("order.add")}
                        onAdd={() => handleAdd(item)}
                        onRemove={() => removeOne(item.id)}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        )}
      </main>

      {status ? (
        <div className="mt-6">
          <GuestOrderStatus
            status={status}
            currency={data?.currency ?? "INR"}
            token={qrToken}
            guestSignals={data?.guestSignals}
            cashLabel={data?.pay?.cashLabel}
            preferredPaymentMethod={data?.pay?.preferred}
            requesting={requestService.isPending}
            onRequest={(type) => requestService.mutate(type)}
          />
        </div>
      ) : null}

      <ModifierPickerDialog
        item={pickerItem}
        open={!!pickerItem}
        onOpenChange={(open) => !open && setPickerItem(null)}
        onConfirm={(ids, label, _portion, sizeId) => {
          if (!pickerItem) return;
          const extra = ids.reduce((sum, id) => {
            const m = pickerItem.modifierGroups
              .flatMap((g) => g.modifierGroup.modifiers)
              .find((x) => x.id === id);
            return sum + (m ? Number(m.priceAdjustment) : 0);
          }, 0);
          addLine(pickerItem, ids, label, extra, sizeId);
        }}
      />

      <footer className="mx-auto max-w-lg px-4 pt-6 pb-4 text-center text-[11px] text-muted-foreground">
        {t("order.pricesIncludeTax")}
        {cartCount > 0 ? ` · ${formatCurrency(cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0))} in cart` : null}
      </footer>

      <GuestCartBar
        lines={cart}
        placing={placeOrder.isPending}
        placeLabel={t("order.placeOrder")}
        placingLabel={t("order.placingOrder")}
        itemsLabel={`${cartCount} ${cartCount > 1 ? t("order.items") : t("order.item")}`}
        error={
          placeOrder.isError
            ? placeOrder.error instanceof ApiError
              ? placeOrder.error.message
              : t("order.couldNotPlace")
            : null
        }
        onPlace={() => placeOrder.mutate()}
        onChangeQty={changeQty}
      />
    </div>
  );
}
