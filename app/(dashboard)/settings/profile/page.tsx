"use client";

import { KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useChangePassword, useCurrentUser, useUpdateProfile } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");

function formatRole(label?: string) {
  if (!label) return "Staff";
  if (label === label.toUpperCase() && label.length <= 12) {
    return label.charAt(0) + label.slice(1).toLowerCase();
  }
  return label;
}

export default function ProfilePage() {
  const { data, isLoading } = useCurrentUser();
  const user = data?.user;
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-56 rounded-3xl" />
      </div>
    );
  }

  const dirty =
    name.trim() !== (user.name ?? "") ||
    email.trim() !== (user.email ?? "") ||
    phone.trim() !== (user.phone ?? "");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_0%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%)]"
        />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 rounded-2xl">
              <AvatarFallback className="rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase">
                Your profile
              </p>
              <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">
                {user.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatRole(user.roleLabel || user.roleName)}
                {user.restaurantName ? ` · ${user.restaurantName}` : ""}
              </p>
              {user.email ? (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/settings/security"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background/80 px-3.5 text-sm font-medium text-foreground hover:bg-secondary"
            >
              <ShieldCheck className="size-4 text-primary" />
              Security
            </Link>
          </div>
        </div>
        {(user.branches?.length ?? 0) > 0 ? (
          <div className="relative flex flex-wrap gap-1.5 border-t border-border/80 px-6 py-3 sm:px-8">
            {(user.branches ?? []).map((branch) => (
              <span
                key={branch.id}
                className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {branch.name}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-base font-semibold tracking-tight text-foreground">Personal details</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            How your name and contact appear to the team.
          </p>
        </div>
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              toast.error("Name is required");
              return;
            }
            updateProfile.mutate(
              {
                name: name.trim(),
                email: email.trim() ? email.trim() : null,
                phone: phone.trim() ? phone.trim() : null,
              },
              {
                onSuccess: () => toast.success("Profile saved"),
                onError: (e) => toast.error(errMsg(e)),
              },
            );
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="profile-name">Full name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="h-11 rounded-xl"
                autoComplete="name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
                autoComplete="email"
                placeholder="you@restaurant.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 rounded-xl"
                autoComplete="tel"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
            <p className="text-xs text-muted-foreground">Role and branches are managed by an owner.</p>
            <Button
              type="submit"
              className="h-10 rounded-xl px-5"
              disabled={!dirty || updateProfile.isPending || !name.trim()}
            >
              {updateProfile.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
            <KeyRound className="size-4" />
          </span>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">Password</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Use a long password you do not reuse elsewhere.
            </p>
          </div>
        </div>
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (newPassword.length < 8) {
              toast.error("New password must be at least 8 characters");
              return;
            }
            if (newPassword !== confirmPassword) {
              toast.error("New passwords do not match");
              return;
            }
            changePassword.mutate(
              { currentPassword, newPassword },
              {
                onSuccess: () => {
                  toast.success("Password updated");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                },
                onError: (e) => toast.error(errMsg(e)),
              },
            );
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="current-password">Current password</Label>
              <PasswordInput
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-11 rounded-xl"
                autoComplete="current-password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 rounded-xl"
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(
                  "h-11 rounded-xl",
                  confirmPassword &&
                    confirmPassword !== newPassword &&
                    "border-destructive focus-visible:ring-destructive/30",
                )}
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="flex justify-end border-t border-border pt-5">
            <Button
              type="submit"
              variant="outline"
              className="h-10 rounded-xl px-5"
              disabled={
                changePassword.isPending ||
                !currentPassword ||
                newPassword.length < 8 ||
                newPassword !== confirmPassword
              }
            >
              {changePassword.isPending ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
