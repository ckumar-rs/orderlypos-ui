"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const audiences = [
  {
    id: "cafe",
    label: "Cafe & truck",
    title: "A short menu, a fast counter.",
    body: "QR and kiosk take the queue. The kitchen gets one ticket stream. Ask checks low stock after the rush.",
  },
  {
    id: "dining",
    label: "Dining room",
    title: "Tables, courses, and the pass.",
    body: "Floor plan, reservations, and station tickets run together. A late dish is marked before the guest asks.",
  },
  {
    id: "branches",
    label: "Branches",
    title: "One sign-in across locations.",
    body: "Each branch keeps its own drawer and stock. The owner still gets the five-minute check after close.",
  },
] as const;

/** Shopify-style “built for your business” audience switcher. */
export function HomeBuiltFor() {
  const [active, setActive] = useState<(typeof audiences)[number]["id"]>("dining");
  const current = audiences.find((item) => item.id === active) ?? audiences[1];

  return (
    <section className="border-y border-border" aria-labelledby="home-built-title">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <p className="text-sm font-medium text-primary">Built for</p>
        <h2
          id="home-built-title"
          className="mt-3 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-4xl"
        >
          Same system. Different service shape.
        </h2>

        <div
          role="tablist"
          aria-label="Restaurant types"
          className="mt-8 flex flex-wrap gap-2"
        >
          {audiences.map((item) => {
            const selected = item.id === active;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(item.id)}
                className={cn(
                  "rounded-md border px-3.5 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 max-w-2xl border-t border-border pt-8">
          <h3 className="text-xl font-medium tracking-tight">{current.title}</h3>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{current.body}</p>
          <Link
            href="/signup"
            className="mt-6 inline-flex text-sm font-medium underline-offset-4 hover:underline"
          >
            Try now OrderlyPOS
          </Link>
        </div>
      </div>
    </section>
  );
}
