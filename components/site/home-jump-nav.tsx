"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#modules", label: "Modules" },
  { href: "#channels", label: "Channels" },
  { href: "#service-day", label: "Service day" },
  { href: "#compare", label: "Compare" },
  { href: "#plan-finder", label: "Plans" },
  { href: "#resources", label: "Resources" },
];

/** In-page jump links for a long Shopify-style landing page. */
export function HomeJumpNav() {
  const [active, setActive] = useState("");

  useEffect(() => {
    const ids = links.map((link) => link.href.slice(1));
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.25, 0.5] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="On this page"
      className="sticky top-14 z-30 border-b border-border bg-background/90 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 py-2 sm:px-6">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className={cn(
                "inline-flex h-8 shrink-0 items-center rounded-md px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
                active === link.href
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
