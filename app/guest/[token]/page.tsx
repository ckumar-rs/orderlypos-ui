"use client";

import { use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";

interface GuestProfile {
  restaurantName: string;
  branchName: string;
  fssaiNumber: string | null;
  name: string | null;
  phone: string | null;
  points: number;
  walletBalance: number;
  tier: { name: string; earnMultiplier: number } | null;
  referralCode: string | null;
  birthdayOffer: number;
}

export default function GuestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [birthday, setBirthday] = useState("");
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await api.post<GuestProfile>("/public/guest", {
        token,
        phone,
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(referralCode.trim() ? { referralCode: referralCode.trim() } : {}),
        ...(birthday ? { birthday } : {}),
      });
      setProfile(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not open your profile");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 bg-background px-5 py-8">
      <div>
        <p className="text-sm text-muted-foreground">Guest</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {profile?.restaurantName ?? "Your membership"}
        </h1>
        {profile?.branchName && (
          <p className="text-sm text-muted-foreground">{profile.branchName}</p>
        )}
      </div>
      {profile ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
          <p className="text-lg font-medium text-foreground">{profile.name || "Guest"}</p>
          <p className="text-sm text-muted-foreground">{profile.phone}</p>
          <p className="text-sm text-foreground">
            {profile.tier ? `${profile.tier.name} · ${profile.tier.earnMultiplier}× points` : "No membership tier yet"}
          </p>
          <p className="text-sm text-foreground">{profile.points} points</p>
          {profile.walletBalance > 0 && (
            <p className="text-sm text-foreground">Wallet ₹{profile.walletBalance.toFixed(2)}</p>
          )}
          {profile.birthdayOffer > 0 && (
            <p className="text-sm text-foreground">Birthday offer: {profile.birthdayOffer}% off this month</p>
          )}
          {profile.referralCode && (
            <p className="text-sm text-foreground">
              Your referral code <span className="font-mono">{profile.referralCode}</span>
            </p>
          )}
          {profile.fssaiNumber && (
            <p className="text-xs text-muted-foreground">FSSAI {profile.fssaiNumber}</p>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="guest-phone">Phone</Label>
            <Input id="guest-phone" required inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="guest-name">Name</Label>
            <Input id="guest-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="guest-birthday">Birthday</Label>
            <Input id="guest-birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="guest-referral">Referral code</Label>
            <Input id="guest-referral" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending}>{pending ? "Opening…" : "Open my profile"}</Button>
        </form>
      )}
    </main>
  );
}
