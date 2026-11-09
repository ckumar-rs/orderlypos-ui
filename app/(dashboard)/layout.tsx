"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Logo } from "@/components/layout/logo";
import { useOnboardingGateState } from "@/components/layout/onboarding-gate";
import { UserMenu } from "@/components/layout/user-menu";
import { useCurrentUser } from "@/hooks/use-auth";
import { BranchProvider, useBranch } from "@/hooks/use-branch";
import { useRealtime } from "@/hooks/use-realtime";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { canOpen, firstAllowedHref } from "@/lib/route-access";

// Subscribes every route in this layout group to realtime push (order/KOT/
// table updates) instead of only the one page (KDS) that happened to call
// useRealtime itself — the Dashboard summary page had NO push subscription
// at all and relied solely on its own 15s/60s polling (see use-dashboard.ts),
// so a payment completed at one terminal took up to 15s to show up on a
// manager's dashboard tab elsewhere, or never did if that tab predates the
// poll window. Rendered as a child of BranchProvider (not the layout
// component itself) since useBranch() needs to run below the provider.
function RealtimeBridge() {
  const { branchId } = useBranch();
  useRealtime(branchId);
  return null;
}

function SetupShell({
  user,
  children,
}: {
  user: NonNullable<ReturnType<typeof useCurrentUser>["data"]>["user"];
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklch,var(--primary)_12%,transparent),_transparent_55%),linear-gradient(180deg,var(--muted)_0%,var(--background)_42%)]"
      />
      <header className="relative z-10 flex h-14 items-center justify-between border-b border-border/70 bg-background/70 px-4 backdrop-blur-md sm:px-6">
        <Link href="/onboarding" className="flex items-center gap-3" aria-label="Setup home">
          <Logo className="h-7 w-auto" />
          <span className="hidden text-sm font-medium tracking-tight text-foreground sm:inline">
            Outlet setup
          </span>
        </Link>
        <UserMenu user={user} />
      </header>
      <main className="relative z-10 flex-1">{children}</main>
    </div>
  );
}

function DashboardChrome({
  user,
  children,
}: {
  user: NonNullable<ReturnType<typeof useCurrentUser>["data"]>["user"];
  children: React.ReactNode;
}) {
  const { blocking, useSetupShell } = useOnboardingGateState();

  if (blocking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">
        Opening setup…
      </div>
    );
  }

  if (useSetupShell) {
    return <SetupShell user={user}>{children}</SetupShell>;
  }

  return <AppShell user={user}>{children}</AppShell>;
}

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, isError } = useCurrentUser();
  const permissions = data?.user.permissions;
  const allowed = !permissions || canOpen(pathname ?? "", permissions, NAV_ITEMS);
  const fallback = permissions ? firstAllowedHref(permissions, NAV_ITEMS) : undefined;

  useEffect(() => {
    if (!isLoading && isError) {
      router.replace("/login");
    }
  }, [isLoading, isError, router]);

  // Direct URL to a page the role may not use (e.g. a waiter opening /dashboard
  // after login): send them to their first permitted screen.
  useEffect(() => {
    if (!allowed && fallback && fallback !== pathname) router.replace(fallback);
  }, [allowed, fallback, pathname, router]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background" />;
  }

  if (isError || !data) {
    return null;
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-sm text-muted-foreground">
        {fallback ? "Redirecting…" : "Your role has no access to this page. Ask an administrator."}
      </div>
    );
  }

  return (
    <BranchProvider>
      <RealtimeBridge />
      <DashboardChrome user={data.user}>{children}</DashboardChrome>
    </BranchProvider>
  );
}
