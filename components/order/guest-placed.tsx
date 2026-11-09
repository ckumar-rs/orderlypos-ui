"use client";

import { CheckCircle2 } from "lucide-react";
import { PopBurst } from "@/components/order/pop-burst";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function GuestPlaced({
  guestName,
  branchName,
  orderNumber,
  onMore,
}: {
  guestName: string;
  branchName?: string;
  orderNumber: string;
  onMore: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_30%,color-mix(in_oklch,var(--success)_22%,transparent),transparent_70%)]"
      />
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative flex size-16 items-center justify-center rounded-full bg-success/10">
          <PopBurst />
          <CheckCircle2 className="size-10 text-success" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("order.thankYouName", { name: guestName })}
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {t("order.thanksMessage", { branch: branchName ?? t("order.theKitchen") })}
          </p>
          <p className="mt-4 inline-flex rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium tabular-nums text-muted-foreground">
            {t("order.orderNumberSent", { number: orderNumber })}
          </p>
        </div>
        <Button variant="outline" className="mt-2 h-11 rounded-xl px-5" onClick={onMore}>
          {t("order.orderMore")}
        </Button>
      </div>
    </div>
  );
}
