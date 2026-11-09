import { permissionSatisfied, type AuthProfile } from "@nodedr-restaurant/types";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { api } from "@/lib/api";
import { firstAllowedHref } from "@/lib/route-access";

/**
 * Where to send a user right after signup/login.
 * Owners who still need first-run setup go to /onboarding; everyone else to
 * their first permitted staff screen.
 */
export async function resolvePostAuthPath(): Promise<string> {
  const me = await api.get<{ user: AuthProfile }>("/auth/me");
  const perms = me.user.permissions ?? [];
  const branchId = me.user.branches?.[0]?.id;

  if (branchId && permissionSatisfied(perms, "settings.manage")) {
    try {
      const status = await api.get<{ needsWizard: boolean }>(
        `/settings/onboarding?branchId=${encodeURIComponent(branchId)}`,
      );
      if (status.needsWizard) return "/onboarding";
    } catch {
      // Settings may be temporarily unavailable — fall through to staff home.
    }
  }

  return firstAllowedHref(perms, NAV_ITEMS) ?? "/dashboard";
}
