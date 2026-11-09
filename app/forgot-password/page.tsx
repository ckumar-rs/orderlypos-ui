"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/site/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter the email on your staff account. We’ll send a reset link when email is set up for this restaurant."
      footer={
        <p className="text-center text-sm text-muted-foreground lg:text-left">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {doneMessage ? (
        <div className="flex flex-col gap-4">
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-foreground"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
            <span>{doneMessage}</span>
          </div>
          <Button render={<Link href="/login" />} className="h-12 text-base">
            Back to sign in
          </Button>
        </div>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setPending(true);
            void api
              .post<{ ok: boolean; message: string }>("/auth/forgot-password", {
                email: email.trim(),
              })
              .then((res) => setDoneMessage(res.message))
              .catch((err) =>
                setError(err instanceof ApiError ? err.message : "Could not start a password reset."),
              )
              .finally(() => setPending(false));
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              className="h-11"
              placeholder="you@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <Button type="submit" className="h-12 text-base" disabled={pending || !email.trim()}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
