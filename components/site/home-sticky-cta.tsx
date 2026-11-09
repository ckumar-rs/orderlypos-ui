"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SKIP = new Set(["/orderlyPOS/terms", "/orderlyPOS/privacy"]);

function showSticky(pathname: string | null) {
  if (!pathname) return false;
  if (SKIP.has(pathname)) return false;
  if (pathname === "/contact") return true;
  return pathname === "/orderlyPOS" || pathname === "/orderlyPOS/" || pathname.startsWith("/orderlyPOS/");
}

/** Shopify sticky ATC — product pages after scroll; skip legal. */
export function HomeStickyCta() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const enabled = showSticky(pathname);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled]);

  if (!enabled || !visible) return null;

  return (
    <>
      <div className="h-[4.25rem] lg:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <p className="min-w-0 text-sm font-medium">
            Try OrderlyPOS
            <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
              No card to create an account
            </span>
          </p>
          <Link
            href="/signup"
            className="inline-flex h-10 shrink-0 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Try now
          </Link>
        </div>
      </div>
    </>
  );
}
