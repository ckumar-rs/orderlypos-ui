"use client";

import { SiteRevealGroup, SiteRevealItem } from "@/components/site/site-motion";

/** Shopify trust strip — real product promises, not invented reviews. */
const promises = [
  {
    title: "No card to try",
    body: "Creating an account does not charge. A paid plan starts when Contrivya confirms it by email.",
  },
  {
    title: "Any device",
    body: "Open it on a phone, tablet, kiosk, or computer. The books stay on the restaurant host.",
  },
  {
    title: "Ask is read only",
    body: "The agent reads sales, tickets, and stock. Staff still ring the bill.",
  },
  {
    title: "Connectors stay off",
    body: "Tally, gateways, and platforms wait until Settings stores that host.",
  },
];

export function HomePromises() {
  return (
    <section className="border-y border-border" aria-label="What you can count on">
      <SiteRevealGroup className="mx-auto grid max-w-6xl sm:grid-cols-2 lg:grid-cols-4">
        {promises.map((item) => (
          <SiteRevealItem
            key={item.title}
            className="border-b border-border px-5 py-8 sm:border-r sm:px-6 lg:border-b-0 lg:last:border-r-0"
          >
            <h2 className="text-sm font-medium">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </SiteRevealItem>
        ))}
      </SiteRevealGroup>
    </section>
  );
}
