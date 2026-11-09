"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterDto } from "@nodedr-restaurant/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthShell } from "@/components/site/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { resolvePostAuthPath } from "@/lib/post-auth-path";

const reassurances = [
  "Creating an account does not charge a card",
  "A paid plan starts when Contrivya confirms it by email",
  "Plans from ₹2,999 a month · yearly is 20% less",
];

export default function SignupPage() {
  const router = useRouter();
  const register = useRegister();
  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterDto>({ resolver: zodResolver(registerSchema) });

  const onSubmit = (dto: RegisterDto) => {
    register.mutate(dto, {
      onSuccess: () => {
        void resolvePostAuthPath()
          .then((path) => router.replace(path))
          .catch(() => router.replace("/onboarding"));
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "Something went wrong");
      },
    });
  };

  return (
    <AuthShell
      title="Create your restaurant"
      subtitle="One account for till, kitchen, floor, and books — on any staff device. No card to start."
      footer={
        <p className="text-center text-sm text-muted-foreground lg:text-left">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
          {" · "}
          <Link href="/orderlyPOS#plan-finder" className="font-medium text-foreground underline-offset-4 hover:underline">
            Find a plan
          </Link>
        </p>
      }
    >
      <ul className="mb-6 border border-border bg-secondary/40 px-4 py-3">
        {reassurances.map((line) => (
          <li key={line} className="py-1 text-xs leading-relaxed text-muted-foreground">
            {line}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="restaurantName">Restaurant name</Label>
          <Input
            id="restaurantName"
            autoComplete="organization"
            className="h-11"
            placeholder="e.g. Spice Route"
            {...field("restaurantName")}
          />
          {errors.restaurantName && (
            <p className="text-xs text-destructive">{errors.restaurantName.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="branchName">First branch name</Label>
          <Input
            id="branchName"
            className="h-11"
            placeholder="Main Branch"
            defaultValue="Main Branch"
            {...field("branchName")}
          />
          {errors.branchName && (
            <p className="text-xs text-destructive">{errors.branchName.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="ownerName">Your name</Label>
          <Input
            id="ownerName"
            autoComplete="name"
            className="h-11"
            placeholder="e.g. Priya Sharma"
            {...field("ownerName")}
          />
          {errors.ownerName && (
            <p className="text-xs text-destructive">{errors.ownerName.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="h-11"
            placeholder="you@restaurant.com"
            {...field("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            className="h-11"
            placeholder="At least 8 characters"
            {...field("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="mt-1 h-12 text-base" disabled={register.isPending}>
          {register.isPending ? "Creating your account…" : "Create account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Creating an account accepts the{" "}
          <Link href="/orderlyPOS/terms" className="font-medium text-foreground underline-offset-4 hover:underline">
            terms
          </Link>{" "}
          and the{" "}
          <Link href="/orderlyPOS/privacy" className="font-medium text-foreground underline-offset-4 hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
