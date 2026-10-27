"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { MenuScreen } from "@/components/kiosk/menu-screen";
import { DoneScreen, ReviewScreen } from "@/components/kiosk/review-screen";
import { GuestSettle } from "@/components/table-qr/guest-settle";
import { Banner, KButton } from "@/components/kiosk/kiosk-ui";
import { KioskHeader, LOCALES_SHOWN } from "@/components/kiosk/kiosk-header";
import { useOnline } from "@/components/kiosk/use-kiosk-device";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import type { KioskMenu } from "@/lib/kiosk-api";
import { toOrderItems } from "@/lib/kiosk-basket";
import { initialKioskState, isBasketLocked, kioskReducer } from "@/lib/kiosk-flow";
import { enqueueRequest, flushQueue } from "@/lib/offline-queue";
import { uuid } from "@/lib/uuid";

interface PublicTableMenu {
  restaurantName: string;
  branchName: string;
  tableName: string;
  logoUrl: string | null;
  currency: string;
  taxMode: "INCLUSIVE" | "EXCLUSIVE";
  taxLabel: string | null;
  upi: { vpa: string; payeeName: string } | null;
  onlineOrdersPaused?: boolean;
  categories: KioskMenu["categories"];
}

function asKioskMenu(data: PublicTableMenu): KioskMenu {
  return {
    restaurantName: data.restaurantName,
    branchName: `${data.branchName} · ${data.tableName}`,
    logoUrl: data.logoUrl,
    currency: data.currency,
    country: "",
    taxMode: data.taxMode,
    taxLabel: data.taxLabel ?? "",
    services: { dineIn: true, takeaway: false },
    upi: data.upi,
    categories: data.categories,
  };
}

export function TableMenuApp({ qrToken }: { qrToken: string }) {
  const { t, locale, setLocale } = useI18n();
  const [state, dispatch] = useReducer(kioskReducer, {
    ...initialKioskState,
    step: "menu",
    serviceType: "DINE_IN",
  });
  const [guestName, setGuestName] = useState("");
  const online = useOnline();
  const menuQuery = useQuery({
    queryKey: ["public-menu", qrToken],
    queryFn: () => api.get<PublicTableMenu>(`/public/menu/${qrToken}`),
    retry: false,
  });
  const menu = menuQuery.data ? asKioskMenu(menuQuery.data) : undefined;
  const localeTag = locale === "es" ? "es-ES" : "en-GB";
  const fmt = useCallback(
    (n: number | string) => formatCurrency(n, menu?.currency ?? "INR", localeTag),
    [menu?.currency, localeTag],
  );
  const header = (
    <KioskHeader
      name={menu?.branchName ?? ""}
      locale={locale}
      onLocale={setLocale}
      locales={LOCALES_SHOWN}
      onCancel={() => dispatch({ type: "RESET" })}
      cancelLabel={t("kiosk.cancel")}
      languageLabel={t("kiosk.language")}
      serviceLabel={menuQuery.data?.tableName ?? null}
      changeLabel={t("kiosk.review.change")}
    />
  );
  const inFlight = useRef(false);

  useEffect(() => {
    if (!online) return;
    void flushQueue(`table-queue:${qrToken}`, async (item) => {
      await api.post(`/public/menu/${qrToken}/order`, item.body);
    });
  }, [online, qrToken]);

  const submit = async () => {
    if (!menu || inFlight.current || state.submit.status === "pending") return;
    inFlight.current = true;
    const requestId = state.requestId ?? uuid();
    dispatch({ type: "SUBMIT_START", newRequestId: requestId });
    const body = {
      guestName: guestName.trim() || "Guest",
      requestId,
      items: toOrderItems(state.basket),
    };
    try {
      const result = await api.post<{ orderNumber: string }>(`/public/menu/${qrToken}/order`, body);
      dispatch({
        type: "SUBMIT_OK",
        confirmation: {
          orderNumber: result.orderNumber,
          createdAt: new Date().toISOString(),
          currency: menu.currency,
          items: state.basket.map((line) => ({
            name: line.name,
            quantity: line.quantity,
            lineTotal: String(line.unitPrice * line.quantity),
          })),
          subtotal: String(state.basket.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)),
          taxAmount: "0",
          totalAmount: String(state.basket.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)),
          paid: false,
        },
      });
    } catch {
      enqueueRequest(`table-queue:${qrToken}`, {
        id: requestId,
        path: `/public/menu/${qrToken}/order`,
        body,
        createdAt: new Date().toISOString(),
      });
      dispatch({
        type: "SUBMIT_OK",
        confirmation: {
          orderNumber: "QUEUED",
          createdAt: new Date().toISOString(),
          currency: menu.currency,
          items: state.basket.map((line) => ({
            name: line.name,
            quantity: line.quantity,
            lineTotal: String(line.unitPrice * line.quantity),
          })),
          subtotal: "0",
          taxAmount: "0",
          totalAmount: "0",
          paid: false,
        },
      });
    } finally {
      inFlight.current = false;
    }
  };

  if (menuQuery.isLoading || !menu) {
    return <p className="p-8 text-center text-muted-foreground">Loading the table menu…</p>;
  }
  if (menuQuery.isError) {
    return <p className="p-8 text-center text-muted-foreground">This table QR is not recognized.</p>;
  }

  if (state.confirmation) {
    return (
      <div className="flex h-full flex-col overflow-auto">
        <DoneScreen
          token={qrToken}
          menu={menu}
          confirmation={state.confirmation}
          secondsLeft={20}
          fmt={fmt}
          localeTag={localeTag}
          online={online}
          onNewOrder={() => dispatch({ type: "RESET" })}
        />
        {state.confirmation.orderNumber !== "QUEUED" ? (
          <GuestSettle token={qrToken} orderNumber={state.confirmation.orderNumber} currency={menu.currency} />
        ) : null}
      </div>
    );
  }

  if (state.step === "review") {
    return (
      <div className="flex h-full flex-col">
        {!online && (
          <div className="p-3">
            <Banner tone="error" title={t("kiosk.offline.title")}>
              {t("kiosk.offline.body")}
            </Banner>
          </div>
        )}
        {menuQuery.data?.onlineOrdersPaused ? (
          <div className="p-3">
            <Banner tone="error" title="Online orders are paused">The kitchen will take orders again when the rush ends.</Banner>
          </div>
        ) : null}
        <label className="px-4 pt-3 text-sm text-muted-foreground">
          Name for this order
          <input
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
        </label>
        <ReviewScreen
          menu={menu}
          basket={state.basket}
          submit={state.submit}
          locked={isBasketLocked(state) || Boolean(menuQuery.data?.onlineOrdersPaused)}
          online={online}
          fmt={fmt}
          header={header}
          serviceLabel={menuQuery.data?.tableName ?? "Table"}
          onChange={(key, delta) => dispatch({ type: "CHANGE_QTY", key, delta })}
          onNote={(key, note) => dispatch({ type: "SET_NOTE", key, note })}
          onBack={() => dispatch({ type: "GOTO", step: "menu" })}
          onConfirm={() => void submit()}
          onStartOver={() => dispatch({ type: "RESET" })}
        />
      </div>
    );
  }

  return (
    <div className="h-full">
      {!online && (
        <div className="p-3">
          <Banner tone="error" title={t("kiosk.offline.title")}>
            {t("kiosk.offline.body")}
          </Banner>
        </div>
      )}
      <MenuScreen
        menu={menu}
        basket={state.basket}
        unavailableNames={[]}
        fmt={fmt}
        header={header}
        onAdd={(line) => dispatch({ type: "ADD", line })}
        onChange={(key, delta) => dispatch({ type: "CHANGE_QTY", key, delta })}
        onReview={() => dispatch({ type: "GOTO", step: "review" })}
      />
      {state.basket.length === 0 && (
        <div className="p-4 text-center">
          <KButton variant="secondary" onClick={() => window.location.assign(`/guest/${qrToken}`)}>
            Guest profile
          </KButton>
        </div>
      )}
    </div>
  );
}
