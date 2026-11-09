"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { useBranch } from "@/hooks/use-branch";
import { useOnboarding } from "@/hooks/use-settings";

function isOnboardingPath(pathname: string | null) {
  return pathname === "/onboarding" || Boolean(pathname?.startsWith("/onboarding/"));
}

function isSettingsPath(pathname: string | null) {
  return Boolean(pathname?.startsWith("/settings"));
}

/**
 * Owners with incomplete first-run setup are kept on /onboarding.
 * Skip, Finish, or Settings → Setup wizard clear / reopen the gate.
 *
 * Returns whether the dashboard shell should wait (redirect in flight) and
 * whether /onboarding should use the minimal setup chrome instead of AppShell.
 */
export function useOnboardingGateState() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: auth } = useCurrentUser();
  const { branchId } = useBranch();
  const canManage = hasPermission(auth?.user, "settings.manage");
  const { data, isLoading, isError } = useOnboarding(canManage ? branchId : null);

  const onOnboarding = isOnboardingPath(pathname);
  const onSettings = isSettingsPath(pathname);
  const needsWizard = Boolean(data?.needsWizard);

  useEffect(() => {
    if (!canManage || isLoading || isError || !data) return;
    if (!needsWizard) return;
    if (onOnboarding || onSettings) return;
    router.replace("/onboarding");
  }, [canManage, isLoading, isError, data, needsWizard, onOnboarding, onSettings, router]);

  const blocking =
    canManage &&
    !isError &&
    (isLoading || (needsWizard && !onOnboarding && !onSettings));

  return {
    canManage,
    needsWizard,
    onOnboarding,
    /** True while we still owe a redirect to /onboarding. */
    blocking,
    /** First-run (and reopen) setup uses a quiet layout without POS nav. */
    useSetupShell: onOnboarding,
  };
}

/** Side-effect-only mount for layouts that already call useOnboardingGateState. */
export function OnboardingGate() {
  useOnboardingGateState();
  return null;
}
