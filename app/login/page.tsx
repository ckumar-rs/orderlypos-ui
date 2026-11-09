"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginDto } from "@nodedr-restaurant/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/site/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/use-auth";
import { ApiError, api } from "@/lib/api";
import { resolvePostAuthPath } from "@/lib/post-auth-path";
import { base64urlToBytes, bytesToBase64url } from "@/lib/webauthn";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginDto>({ resolver: zodResolver(loginSchema) });

  const goAfterAuth = async () => {
    try {
      router.replace(await resolvePostAuthPath());
    } catch {
      router.replace("/dashboard");
    }
  };

  const onSubmit = (dto: LoginDto) => {
    setError(null);
    login.mutate(dto, {
      onSuccess: () => {
        void goAfterAuth();
      },
      onError: (err) => {
        if (err instanceof ApiError && err.message === "TWO_FACTOR_REQUIRED") {
          setNeedsCode(true);
          return;
        }
        if (err instanceof ApiError && err.status >= 500) {
          setError("The server is having a problem right now. Please try again in a minute.");
        } else if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Can't reach the server. Check your internet connection and try again.");
        }
      },
    });
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Open the till, kitchen, and floor on phone, tablet, kiosk, or till."
      footer={
        <p className="text-center text-sm text-muted-foreground lg:text-left">
          New restaurant?{" "}
          <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
          {" · "}
          <Link href="/orderlyPOS" className="font-medium text-foreground underline-offset-4 hover:underline">
            See the product
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
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
            enterKeyHint="next"
            autoFocus
            className="h-11"
            placeholder="you@restaurant.com"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            enterKeyHint="go"
            className="h-11"
            placeholder="Your password"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {needsCode && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="totp">Verification code</Label>
            <Input
              id="totp"
              inputMode="text"
              autoComplete="one-time-code"
              autoFocus
              placeholder="6-digit code or recovery code"
              {...register("totp")}
            />
            <p className="text-xs text-muted-foreground">
              Open your authenticator app, or use one of your recovery codes.
            </p>
            {errors.totp && <p className="text-xs text-destructive">{errors.totp.message}</p>}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" className="mt-1 h-12 text-base" disabled={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <Button
        type="button"
        variant="outline"
        className="mt-3 h-12 w-full text-base"
        onClick={() => {
          const email = getValues("email");
          if (!email) {
            setError("Enter your email, then use the passkey.");
            return;
          }
          setError(null);
          void api
            .post<{ challenge: string; allowCredentials: { id: string }[] }>("/auth/webauthn/login/options", { email })
            .then(async (options) => {
              const credential = await navigator.credentials.get({
                publicKey: {
                  challenge: base64urlToBytes(options.challenge),
                  rpId: window.location.hostname,
                  allowCredentials: options.allowCredentials.map((row) => ({
                    type: "public-key" as const,
                    id: base64urlToBytes(row.id),
                  })),
                  userVerification: "preferred",
                  timeout: 60000,
                },
              });
              if (!credential || credential.type !== "public-key") return;
              const assertion = credential as PublicKeyCredential;
              const response = assertion.response as AuthenticatorAssertionResponse;
              await api.post("/auth/webauthn/login/verify", {
                email,
                credentialId: bytesToBase64url(assertion.rawId),
                authenticatorData: bytesToBase64url(response.authenticatorData),
                clientDataJSON: bytesToBase64url(response.clientDataJSON),
                signature: bytesToBase64url(response.signature),
                totp: getValues("totp"),
              });
              await goAfterAuth();
            })
            .catch((err) => {
              if (err instanceof ApiError && err.message === "TWO_FACTOR_REQUIRED") {
                setNeedsCode(true);
                setError("Enter the verification code, then use the passkey again.");
                return;
              }
              setError(err instanceof ApiError ? err.message : "The passkey was not accepted.");
            });
        }}
      >
        Sign in with a passkey
      </Button>
    </AuthShell>
  );
}
