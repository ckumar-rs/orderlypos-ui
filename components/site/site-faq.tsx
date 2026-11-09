"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type SiteFaqItem = { q: string; a: string };

/** Reusable FAQ accordion for any marketing page. */
export function SiteFaq({
  eyebrow = "FAQ",
  title,
  items,
}: {
  eyebrow?: string;
  title: string;
  items: SiteFaqItem[];
}) {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="border-t border-border" aria-labelledby={`${baseId}-title`}>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-16">
        <div>
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h2 id={`${baseId}-title`} className="mt-3 text-3xl font-medium tracking-tight text-balance sm:text-4xl">
            {title}
          </h2>
        </div>
        <ul className="border-t border-border">
          {items.map((item, index) => {
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
                      className={cn("mt-1 text-muted-foreground transition-transform", expanded && "rotate-45")}
                    >
                      +
                    </span>
                  </button>
                </h3>
                <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!expanded} className="pb-5">
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
