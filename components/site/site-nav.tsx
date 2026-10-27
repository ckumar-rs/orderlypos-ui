"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; note: string };

const product: Item[] = [
  { href: "/orderlyPOS/features", label: "Features", note: "Every staff screen, and what it is for" },
  { href: "/orderlyPOS/agent", label: "Agentic", note: "Ask reads the books. Rules run every five minutes" },
  { href: "/orderlyPOS/how-to-use", label: "How to use", note: "From the door to the cash drawer" },
];

const company: Item[] = [
  { href: "/orderlyPOS/blog", label: "Blog", note: "Notes from the build" },
  { href: "/orderlyPOS/about", label: "About", note: "Contrivya, and where the software runs" },
  { href: "/contact", label: "Contact", note: "info@contrivya.com" },
];

const direct = [
  { href: "/orderlyPOS/pricing", label: "Pricing" },
  { href: "/orderlyPOS/docs", label: "Docs" },
];

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 12 12" className={cn("size-3 transition-transform", open && "rotate-180")} aria-hidden>
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const [panel, setPanel] = useState(false);
  const [menu, setMenu] = useState<"product" | "company" | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const productId = useId();
  const companyId = useId();

  useEffect(() => {
    setPanel(false);
    setMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (!menu) return;
    const onPointer = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setMenu(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(null);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const menus = [
    { key: "product" as const, label: "Product", id: productId, items: product },
    { key: "company" as const, label: "Company", id: companyId, items: company },
  ];

  return (
    <>
      <button
        type="button"
        className="col-start-2 row-start-1 inline-flex h-9 w-9 items-center justify-center justify-self-start rounded-md lg:hidden"
        aria-expanded={panel}
        aria-controls="site-menu"
        onClick={() => setPanel((value) => !value)}
      >
        <span className="sr-only">{panel ? "Close menu" : "Open menu"}</span>
        <span aria-hidden className="relative block h-3 w-4">
          <span
            className={cn(
              "absolute left-0 h-px w-4 bg-foreground transition-transform",
              panel ? "top-1.5 rotate-45" : "top-0",
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-1.5 h-px w-4 bg-foreground transition-opacity",
              panel ? "opacity-0" : "opacity-100",
            )}
          />
          <span
            className={cn(
              "absolute left-0 h-px w-4 bg-foreground transition-transform",
              panel ? "top-1.5 -rotate-45" : "top-3",
            )}
          />
        </span>
      </button>

      <nav ref={navRef} className="hidden min-w-0 flex-1 items-center gap-1 lg:flex" aria-label="Site">
        {[menus[0], ...direct, menus[1]].map((entry) => {
          if ("items" in entry) {
            const open = menu === entry.key;
            const current = entry.items.some((item) => isCurrent(pathname, item.href));
            return (
              <div key={entry.key} className="relative">
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[13px] font-medium",
                    open || current ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-expanded={open}
                  aria-controls={entry.id}
                  onClick={() => setMenu(open ? null : entry.key)}
                >
                  {entry.label}
                  <Chevron open={open} />
                </button>
                {open ? (
                  <ul
                    id={entry.id}
                    className="absolute top-full left-0 z-50 mt-2 w-72 rounded-lg border border-border bg-popover p-1.5 shadow-sm"
                  >
                    {entry.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                          className="block rounded-md px-3 py-2 hover:bg-muted"
                        >
                          <span className="block text-sm font-medium">{item.label}</span>
                          <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">{item.note}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          }
          const current = isCurrent(pathname, entry.href);
          return (
            <Link
              key={entry.href}
              href={entry.href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-md px-2.5 text-[13px] font-medium",
                current ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {entry.label}
            </Link>
          );
        })}
      </nav>

      {panel ? (
        <div className="fixed inset-0 top-14 z-30 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 h-screen w-full bg-foreground/25"
            aria-label="Close menu"
            onClick={() => setPanel(false)}
          />
          <nav id="site-menu" aria-label="Site" className="relative max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-border bg-background px-5 py-6">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Product</p>
            <ul className="mt-2">
              {product.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                    className="block py-2"
                  >
                    <span className="block text-base font-medium">{item.label}</span>
                    <span className="block text-sm text-muted-foreground">{item.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-4 border-t border-border pt-4">
              {direct.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
                    className="block py-2 text-base font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs font-medium tracking-wide text-muted-foreground uppercase">Company</p>
            <ul className="mt-2">
              {company.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                    className="block py-2"
                  >
                    <span className="block text-base font-medium">{item.label}</span>
                    <span className="block text-sm text-muted-foreground">{item.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/login" className="mt-6 inline-flex py-2 text-base font-medium sm:hidden">
              Sign in
            </Link>
          </nav>
        </div>
      ) : null}
    </>
  );
}
