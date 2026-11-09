"use client";

import type { AuthProfile, SessionUser } from "@nodedr-restaurant/types";
import { KeyRound, LogOut, Moon, Settings2, Sun, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/hooks/use-auth";

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type MenuUser = SessionUser & Partial<Pick<AuthProfile, "email" | "roleLabel" | "restaurantName">>;

function formatRole(label?: string) {
  if (!label) return "Staff";
  if (label === label.toUpperCase() && label.length <= 12) {
    return label.charAt(0) + label.slice(1).toLowerCase();
  }
  return label;
}

export function UserMenu({ user }: { user?: MenuUser }) {
  const { theme, setTheme } = useTheme();
  const logout = useLogout();
  const router = useRouter();
  const isDark = theme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 outline-none hover:bg-secondary data-[state=open]:bg-secondary">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg bg-primary text-[11px] font-semibold text-primary-foreground">
            {initials(user?.name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[9rem] truncate text-sm font-medium sm:block">
          {user?.name}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-0">
        <DropdownMenuLabel className="p-0">
          <div className="border-b border-border bg-[radial-gradient(80%_120%_at_0%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_60%)] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Avatar className="size-11 rounded-xl">
                <AvatarFallback className="rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                  {initials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatRole(user?.roleLabel || user?.roleName)}
                  {user?.restaurantName ? ` · ${user.restaurantName}` : ""}
                </p>
                {user?.email ? (
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{user.email}</p>
                ) : null}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <div className="p-1.5">
          <DropdownMenuItem
            className="h-9 cursor-pointer rounded-lg"
            render={<Link href="/settings/profile" />}
          >
            <UserRound className="size-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className="h-9 cursor-pointer rounded-lg"
            render={<Link href="/settings/security" />}
          >
            <KeyRound className="size-4" />
            Security
          </DropdownMenuItem>
          <DropdownMenuItem
            className="h-9 cursor-pointer rounded-lg"
            render={<Link href="/settings" />}
          >
            <Settings2 className="size-4" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="h-9 cursor-pointer rounded-lg"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {isDark ? "Light mode" : "Dark mode"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="h-9 cursor-pointer rounded-lg text-destructive focus:text-destructive"
            onClick={() => logout.mutate(undefined, { onSuccess: () => router.push("/login") })}
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
