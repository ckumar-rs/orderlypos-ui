"use client";

import {
  TAX_REGIME_PRESETS,
  TAX_REGIMES,
  type TaxRegime,
} from "@nodedr-restaurant/types";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Grid2x2,
  Leaf,
  MapPinned,
  Store,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useBranch } from "@/hooks/use-branch";
import { useCreateCategory, useCreateMenuItem } from "@/hooks/use-menu";
import {
  useOnboarding,
  usePatchOnboarding,
  useSettings,
  useUpdateBranchSettings,
  useUpdateRestaurantSettings,
  type OnboardingConfig,
  type OnboardingStep,
} from "@/hooks/use-settings";
import { useBulkCreateTables, useCreateFloor, useFloors } from "@/hooks/use-tables";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const STEP_ICONS: Record<Exclude<OnboardingStep, "done">, typeof Store> = {
  business: Store,
  branch: MapPinned,
  floor: Grid2x2,
  menu: UtensilsCrossed,
  guests: Users,
};

function stepsFromConfig(config: OnboardingConfig) {
  return [
    { id: "business" as const, title: config.labelBusiness, body: config.bodyBusiness },
    { id: "branch" as const, title: config.labelBranch, body: config.bodyBranch },
    { id: "floor" as const, title: config.labelFloor, body: config.bodyFloor },
    { id: "menu" as const, title: config.labelMenu, body: config.bodyMenu },
    { id: "guests" as const, title: config.labelGuests, body: config.bodyGuests },
  ];
}

function StepActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border/80 pt-5">
      {children}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { branchId } = useBranch();
  const { data: status, isLoading: statusLoading } = useOnboarding(branchId);
  const { data: settings, isLoading: settingsLoading } = useSettings(branchId);
  const patch = usePatchOnboarding(branchId);
  const [step, setStep] = useState<OnboardingStep>("business");

  useEffect(() => {
    if (!status) return;
    if (status.step && status.step !== "done") setStep(status.step);
  }, [status?.step]);

  const steps = status?.config ? stepsFromConfig(status.config) : [];
  const stepIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === step),
  );
  const progress = steps.length ? ((stepIndex + 1) / steps.length) * 100 : 0;
  const current = steps[stepIndex];
  const CurrentIcon = current ? STEP_ICONS[current.id] : Store;

  const finish = (action: "complete" | "skip") => {
    patch.mutate(
      { action },
      {
        onSuccess: () => {
          toast.success(action === "skip" ? "Setup skipped" : "Outlet ready");
          router.replace("/dashboard");
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not finish setup"),
      },
    );
  };

  const goNext = (next: OnboardingStep) => {
    setStep(next);
    patch.mutate({ action: "advance", step: next });
  };

  if (statusLoading || settingsLoading || !settings || !status?.config) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 lg:flex-row lg:gap-10 lg:p-10">
        <Skeleton className="h-72 w-full max-w-xs" />
        <Skeleton className="h-96 flex-1" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12 lg:py-12">
      <aside className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            First-run setup
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Ready for service
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Five short steps. Nothing is demo-filled — you enter what this outlet actually uses.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Step {stepIndex + 1} of {steps.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.35, ease }}
            />
          </div>
        </div>

        <ol className="hidden flex-col gap-1 lg:flex">
          {steps.map((s, i) => {
            const done = Boolean(status.checks[s.id as keyof typeof status.checks]);
            const active = s.id === step;
            const Icon = STEP_ICONS[s.id];
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                    active
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                      active
                        ? "border-primary/40 bg-primary text-primary-foreground"
                        : done
                          ? "border-border bg-background text-foreground"
                          : "border-border bg-background",
                    )}
                  >
                    {done && !active ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <Icon className="size-3.5" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{s.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {done ? "Saved" : i < stepIndex ? "Visited" : "Pending"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-auto hidden lg:block">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-0 text-muted-foreground"
            disabled={patch.isPending}
            onClick={() => finish("skip")}
          >
            Skip setup for now
          </Button>
        </div>
      </aside>

      <section className="min-w-0">
        <div className="mb-5 flex items-start justify-between gap-3 lg:hidden">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <CurrentIcon className="size-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{current?.title}</h2>
              <p className="text-sm text-muted-foreground">{current?.body}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={patch.isPending}
            onClick={() => finish("skip")}
          >
            Skip
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-5 shadow-[0_20px_50px_-40px_rgba(17,24,39,0.45)] sm:p-7">
          <div className="mb-6 hidden lg:block">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <CurrentIcon className="size-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {current?.title}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{current?.body}</p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease }}
            >
              {step === "business" && (
                <BusinessStep
                  branchId={branchId}
                  currency={settings.restaurant.currency}
                  timezone={settings.restaurant.timezone}
                  upiVpa={settings.restaurant.upiVpa ?? ""}
                  upiPayeeName={settings.restaurant.upiPayeeName ?? ""}
                  onDone={() => goNext("branch")}
                />
              )}
              {step === "branch" && (
                <BranchStep
                  branchId={branchId}
                  address={settings.branch.address ?? ""}
                  phone={settings.branch.phone ?? ""}
                  country={settings.branch.country}
                  taxRegime={settings.branch.taxRegime}
                  gstNumber={settings.branch.gstNumber ?? ""}
                  onBack={() => setStep("business")}
                  onDone={() => goNext("floor")}
                />
              )}
              {step === "floor" && (
                <FloorStep
                  branchId={branchId}
                  config={status.config}
                  onBack={() => setStep("branch")}
                  onDone={() => goNext("menu")}
                  onSkip={() => goNext("menu")}
                />
              )}
              {step === "menu" && (
                <MenuStep
                  branchId={branchId}
                  config={status.config}
                  onBack={() => setStep("floor")}
                  onDone={() => goNext("guests")}
                  onSkip={() => goNext("guests")}
                />
              )}
              {step === "guests" && (
                <GuestsStep
                  branchId={branchId}
                  loyaltyEarnPerCurrency={settings.restaurant.loyaltyEarnPerCurrency}
                  loyaltyPointValue={settings.restaurant.loyaltyPointValue}
                  onBack={() => setStep("menu")}
                  onDone={() => finish("complete")}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function BusinessStep({
  branchId,
  currency: initialCurrency,
  timezone: initialTimezone,
  upiVpa: initialUpi,
  upiPayeeName: initialPayee,
  onDone,
}: {
  branchId: string | null;
  currency: string;
  timezone: string;
  upiVpa: string;
  upiPayeeName: string;
  onDone: () => void;
}) {
  const update = useUpdateRestaurantSettings(branchId);
  const [currency, setCurrency] = useState(initialCurrency);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [upiVpa, setUpiVpa] = useState(initialUpi);
  const [upiPayeeName, setUpiPayeeName] = useState(initialPayee);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate(
          {
            currency: currency.trim().toUpperCase(),
            timezone: timezone.trim(),
            upiVpa: upiVpa.trim() || null,
            upiPayeeName: upiPayeeName.trim() || null,
          },
          {
            onSuccess: () => {
              toast.success("Business saved");
              onDone();
            },
            onError: (err) =>
              toast.error(err instanceof ApiError ? err.message : "Could not save"),
          },
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ob-currency">Currency</Label>
          <Input
            id="ob-currency"
            value={currency}
            maxLength={3}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            placeholder="INR"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ob-tz">Timezone</Label>
          <Input
            id="ob-tz"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="Asia/Kolkata"
            required
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ob-upi">UPI id</Label>
          <Input
            id="ob-upi"
            value={upiVpa}
            onChange={(e) => setUpiVpa(e.target.value)}
            placeholder="name@okbank"
          />
          <p className="text-xs text-muted-foreground">Optional — powers the guest checkout QR.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ob-payee">UPI payee name</Label>
          <Input
            id="ob-payee"
            value={upiPayeeName}
            onChange={(e) => setUpiPayeeName(e.target.value)}
            placeholder="Restaurant name on UPI"
          />
        </div>
      </div>
      <StepActions>
        <Button type="submit" className="min-w-36" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save and continue"}
          {!update.isPending ? <ChevronRight className="size-4" aria-hidden /> : null}
        </Button>
      </StepActions>
    </form>
  );
}

function BranchStep({
  branchId,
  address: initialAddress,
  phone: initialPhone,
  country: initialCountry,
  taxRegime: initialRegime,
  gstNumber: initialGst,
  onBack,
  onDone,
}: {
  branchId: string | null;
  address: string;
  phone: string;
  country: string;
  taxRegime: TaxRegime;
  gstNumber: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const update = useUpdateBranchSettings(branchId);
  const [address, setAddress] = useState(initialAddress);
  const [phone, setPhone] = useState(initialPhone);
  const [country, setCountry] = useState(initialCountry);
  const [taxRegime, setTaxRegime] = useState<TaxRegime>(initialRegime);
  const [gstNumber, setGstNumber] = useState(initialGst);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const preset = TAX_REGIME_PRESETS[taxRegime];
        update.mutate(
          {
            address: address.trim() || undefined,
            phone: phone.trim() || undefined,
            country: country.trim() || undefined,
            taxRegime,
            taxMode: preset.defaultMode,
            gstNumber: gstNumber.trim() || undefined,
          },
          {
            onSuccess: () => {
              toast.success("Branch saved");
              onDone();
            },
            onError: (err) =>
              toast.error(err instanceof ApiError ? err.message : "Could not save"),
          },
        );
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="ob-address">Address</Label>
        <Input
          id="ob-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street, area, city"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ob-phone">Phone</Label>
          <Input
            id="ob-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91…"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ob-country">Country</Label>
          <Input
            id="ob-country"
            value={country}
            maxLength={2}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            placeholder="IN"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>Tax regime</Label>
          <Select value={taxRegime} onValueChange={(v) => setTaxRegime(v as TaxRegime)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAX_REGIMES.map((regime) => (
                <SelectItem key={regime} value={regime}>
                  {TAX_REGIME_PRESETS[regime].displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ob-gst">GSTIN / tax id</Label>
          <Input
            id="ob-gst"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>
      <StepActions>
        <Button type="button" variant="secondary" onClick={onBack}>
          <ChevronLeft className="size-4" aria-hidden />
          Back
        </Button>
        <Button type="submit" className="min-w-36" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save and continue"}
          {!update.isPending ? <ChevronRight className="size-4" aria-hidden /> : null}
        </Button>
      </StepActions>
    </form>
  );
}

function FloorStep({
  branchId,
  config,
  onBack,
  onDone,
  onSkip,
}: {
  branchId: string | null;
  config: OnboardingConfig;
  onBack: () => void;
  onDone: () => void;
  onSkip: () => void;
}) {
  const { data: floors } = useFloors(branchId);
  const createFloor = useCreateFloor(branchId);
  const bulkTables = useBulkCreateTables(branchId);
  const [floorName, setFloorName] = useState(config.defaultFloorName);
  const [tableCount, setTableCount] = useState(config.defaultTableCount);
  const [capacity, setCapacity] = useState(config.defaultTableCapacity);
  const ready = useMemo(
    () => (floors ?? []).some((f) => f.tables.length > 0),
    [floors],
  );
  const pending = createFloor.isPending || bulkTables.isPending;

  const createFloorAndTables = () => {
    const name = floorName.trim();
    const count = Number(tableCount);
    const cap = Number(capacity);
    if (!name) {
      toast.error("Enter an area name");
      return;
    }
    if (!Number.isFinite(count) || count < 1 || count > 20) {
      toast.error("Enter how many tables (1–20)");
      return;
    }
    if (!Number.isFinite(cap) || cap < 1 || cap > 20) {
      toast.error("Enter seats per table (1–20)");
      return;
    }
    const numbers = Array.from({ length: count }, (_, i) => String(i + 1));
    createFloor.mutate(name, {
      onSuccess: (floor) => {
        const floorId = (floor as { id: string }).id;
        bulkTables.mutate(
          { floorId, numbers, capacity: cap, shape: "square" },
          {
            onSuccess: () => {
              toast.success("Floor and tables created");
              onDone();
            },
            onError: (err) =>
              toast.error(err instanceof ApiError ? err.message : "Could not create tables"),
          },
        );
      },
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not create floor"),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {ready ? (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          This branch already has tables. Continue, or add another area later under Tables.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ob-floor">Area name</Label>
            <Input
              id="ob-floor"
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
              placeholder="e.g. Ground floor"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ob-tables">Number of tables</Label>
              <Input
                id="ob-tables"
                type="number"
                min={1}
                max={20}
                value={tableCount}
                onChange={(e) => setTableCount(e.target.value)}
                placeholder="8"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ob-cap">Seats per table</Label>
              <Input
                id="ob-cap"
                type="number"
                min={1}
                max={20}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="4"
                required
              />
            </div>
          </div>
        </>
      )}
      <StepActions>
        <Button type="button" variant="secondary" onClick={onBack}>
          <ChevronLeft className="size-4" aria-hidden />
          Back
        </Button>
        {ready ? (
          <Button type="button" className="min-w-36" onClick={onDone}>
            Continue
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        ) : (
          <>
            <Button type="button" className="min-w-36" disabled={pending} onClick={createFloorAndTables}>
              {pending ? "Creating…" : "Create floor and tables"}
            </Button>
            <Button type="button" variant="ghost" onClick={onSkip}>
              Skip for now
            </Button>
          </>
        )}
      </StepActions>
    </div>
  );
}

function MenuStep({
  branchId,
  config,
  onBack,
  onDone,
  onSkip,
}: {
  branchId: string | null;
  config: OnboardingConfig;
  onBack: () => void;
  onDone: () => void;
  onSkip: () => void;
}) {
  const createCategory = useCreateCategory(branchId);
  const createItem = useCreateMenuItem(branchId);
  const [categoryName, setCategoryName] = useState(config.defaultCategoryName);
  const [dishName, setDishName] = useState(config.defaultDishName);
  const [price, setPrice] = useState(config.defaultDishPrice);
  const [taxPercent, setTaxPercent] = useState(config.defaultDishTaxPercent);
  const [isVeg, setIsVeg] = useState(true);
  const pending = createCategory.isPending || createItem.isPending;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const category = categoryName.trim();
        const dish = dishName.trim();
        const amount = Number(price);
        const tax = Number(taxPercent);
        if (!category || !dish) {
          toast.error("Enter a category and dish name");
          return;
        }
        if (!Number.isFinite(amount) || amount < 0) {
          toast.error("Enter a valid price");
          return;
        }
        if (!Number.isFinite(tax) || tax < 0 || tax > 100) {
          toast.error("Enter a tax percent between 0 and 100");
          return;
        }
        createCategory.mutate(
          { name: category, sortOrder: 0, isActive: true, showOnWebsite: true },
          {
            onSuccess: (created) => {
              createItem.mutate(
                {
                  categoryId: (created as { id: string }).id,
                  name: dish,
                  price: amount,
                  taxRatePercent: tax,
                  isVeg,
                  isVegan: false,
                  isJain: false,
                  isHalal: false,
                  isGlutenFree: false,
                  spiceLevel: "NONE",
                  allergens: [],
                  isActive: true,
                  modifierGroupIds: [],
                },
                {
                  onSuccess: () => {
                    toast.success("Dish added");
                    onDone();
                  },
                  onError: (err) =>
                    toast.error(err instanceof ApiError ? err.message : "Could not add dish"),
                },
              );
            },
            onError: (err) =>
              toast.error(err instanceof ApiError ? err.message : "Could not add category"),
          },
        );
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="ob-cat">Category</Label>
        <Input
          id="ob-cat"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="e.g. Mains"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ob-dish">Dish name</Label>
          <Input
            id="ob-dish"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            placeholder="e.g. Butter chicken"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ob-price">Price</Label>
          <Input
            id="ob-price"
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ob-tax">Tax %</Label>
          <Input
            id="ob-tax"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
            placeholder="5"
            required
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Leaf className="size-4 text-muted-foreground" aria-hidden />
            <Label htmlFor="ob-veg" className="cursor-pointer">
              Vegetarian
            </Label>
          </div>
          <Switch id="ob-veg" checked={isVeg} onCheckedChange={setIsVeg} />
        </div>
      </div>
      <StepActions>
        <Button type="button" variant="secondary" onClick={onBack}>
          <ChevronLeft className="size-4" aria-hidden />
          Back
        </Button>
        <Button type="submit" className="min-w-36" disabled={pending}>
          {pending ? "Saving…" : "Add dish and continue"}
          {!pending ? <ChevronRight className="size-4" aria-hidden /> : null}
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
      </StepActions>
    </form>
  );
}

function GuestsStep({
  branchId,
  loyaltyEarnPerCurrency,
  loyaltyPointValue,
  onBack,
  onDone,
}: {
  branchId: string | null;
  loyaltyEarnPerCurrency: number;
  loyaltyPointValue: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const update = useUpdateRestaurantSettings(branchId);
  const [earn, setEarn] = useState(String(loyaltyEarnPerCurrency));
  const [pointValue, setPointValue] = useState(String(loyaltyPointValue));

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const earnN = Number(earn);
        const valueN = Number(pointValue);
        if (!Number.isFinite(earnN) || earnN < 1) {
          toast.error("Enter earn rate (currency units per point)");
          return;
        }
        if (!Number.isFinite(valueN) || valueN < 0) {
          toast.error("Enter a redeem value for one point");
          return;
        }
        update.mutate(
          {
            loyaltyEarnPerCurrency: earnN,
            loyaltyPointValue: valueN,
          },
          {
            onSuccess: () => {
              toast.success("Loyalty rules saved");
              onDone();
            },
            onError: (err) =>
              toast.error(err instanceof ApiError ? err.message : "Could not save"),
          },
        );
      }}
    >
      <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Till and table QR attach guests by phone. These rules decide how points earn and redeem.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ob-earn">Earn 1 point per</Label>
          <Input
            id="ob-earn"
            type="number"
            min={1}
            value={earn}
            onChange={(e) => setEarn(e.target.value)}
            placeholder="100"
            required
          />
          <p className="text-xs text-muted-foreground">Currency units spent for one point.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ob-redeem">1 point redeems for</Label>
          <Input
            id="ob-redeem"
            type="number"
            min={0}
            step="0.01"
            value={pointValue}
            onChange={(e) => setPointValue(e.target.value)}
            placeholder="1"
            required
          />
          <p className="text-xs text-muted-foreground">Currency value of a single point.</p>
        </div>
      </div>
      <StepActions>
        <Button type="button" variant="secondary" onClick={onBack}>
          <ChevronLeft className="size-4" aria-hidden />
          Back
        </Button>
        <Button type="submit" className="min-w-36" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Finish setup"}
        </Button>
      </StepActions>
    </form>
  );
}
