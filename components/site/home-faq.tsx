"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Do I need a card to try OrderlyPOS?",
    a: "Creating an account does not charge a card. A paid plan starts at ₹2,999 a month when Contrivya confirms it by email.",
  },
  {
    q: "Where does the software run?",
    a: "On phone, tablet, kiosk, or computer. The books stay on the restaurant host. Connectors only post after their address is stored in Settings.",
  },
  {
    q: "Can Ask take a payment?",
    a: "No. Ask reads sales, tickets, stock, and reservations. Staff still ring the bill on the till.",
  },
  {
    q: "Which guest channels are included?",
    a: "Table QR and WhatsApp catalog ship with the product. The self-order kiosk is on Pro. All of them write the same menu and kitchen tickets.",
  },
  {
    q: "How do I get help?",
    a: "WhatsApp or call +91-9346342691, or email info@contrivya.com. There is no call centre — a message reaches the people who build OrderlyPOS.",
  },
];

/** Compact FAQ — same conversion job Shopify puts near the bottom of the home page. */
export function HomeFaq() {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="border-t border-border" aria-labelledby="home-faq-title">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-16">
        <div>
          <p className="text-sm font-medium text-primary">FAQ</p>
          <h2
            id="home-faq-title"
            className="mt-3 text-3xl font-medium tracking-tight text-balance sm:text-4xl"
          >
            Before you sign up.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Still unsure?{" "}
            <Link href="/contact" className="font-medium text-foreground underline-offset-4 hover:underline">
              Contact Contrivya
            </Link>
            .
          </p>
        </div>
        <ul className="border-t border-border">
          {faqs.map((item, index) => {
            const expanded = open === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;
            return (
              <li key={item.q} className="border-b border-border">
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    className="flex w-full items-start justify-between gap-4 py-5 text-left"
                    onClick={() => setOpen(expanded ? null : index)}
                  >
                    <span className="text-base font-medium">{item.q}</span>
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1 text-muted-foreground transition-transform",
                        expanded && "rotate-45",
                      )}
                    >
                      +
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!expanded}
                  className="pb-5"
                >
                  <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
