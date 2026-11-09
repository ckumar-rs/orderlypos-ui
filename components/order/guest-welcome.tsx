"use client";

import { ArrowRight } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n/context";

export function GuestWelcome({
  branchName,
  tableName,
  loading,
  nameDraft,
  onNameDraft,
  phoneDraft,
  onPhoneDraft,
  onContinue,
}: {
  branchName?: string;
  tableName?: string;
  loading: boolean;
  nameDraft: string;
  onNameDraft: (value: string) => void;
  phoneDraft?: string;
  onPhoneDraft?: (value: string) => void;
  onContinue: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_55%_at_50%_-10%,color-mix(in_oklch,var(--primary)_28%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,color-mix(in_oklch,var(--secondary)_80%,transparent),transparent)]"
      />

      <header className="relative z-10 flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <p className="text-[11px] font-medium tracking-[0.18em] text-primary uppercase">Table order</p>
        <LanguageSwitcher compact />
      </header>

      <main className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-10">
        <div className="mx-auto w-full max-w-sm">
          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-5 w-28" />
            </div>
          ) : (
            <div>
              {tableName ? (
                <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {tableName}
                </p>
              ) : null}
              <h1 className="mt-4 text-[2.35rem] leading-[1.05] font-semibold tracking-tight text-balance text-foreground">
                {branchName}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Browse the menu, send dishes to the kitchen, and pay when you are ready.
              </p>
            </div>
          )}

          <form
            className="mt-10 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              onContinue();
            }}
          >
            <div className="flex flex-col gap-2 text-left">
              <Label htmlFor="guest-name" className="text-sm font-medium">
                {t("order.whatsYourName")}
              </Label>
              <Input
                id="guest-name"
                value={nameDraft}
                onChange={(e) => onNameDraft(e.target.value)}
                placeholder={t("order.namePlaceholder")}
                autoFocus
                maxLength={60}
                className="h-12 rounded-xl border-border/80 bg-card text-base shadow-none"
              />
            </div>
            {onPhoneDraft ? (
              <div className="flex flex-col gap-2 text-left">
                <Label htmlFor="guest-phone" className="text-sm font-medium">
                  Phone for points (optional)
                </Label>
                <Input
                  id="guest-phone"
                  inputMode="tel"
                  value={phoneDraft ?? ""}
                  onChange={(e) => onPhoneDraft(e.target.value)}
                  placeholder="10-digit mobile"
                  maxLength={20}
                  className="h-12 rounded-xl border-border/80 bg-card text-base shadow-none"
                />
              </div>
            ) : null}
            <Button
              type="submit"
              className="h-12 rounded-xl text-base font-medium"
              disabled={!nameDraft.trim() || loading}
            >
              {t("order.continueToMenu")}
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
