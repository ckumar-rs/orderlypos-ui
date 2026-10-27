"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/kds", label: "Status board" },
  { href: "/kds/stations", label: "Stations" },
  { href: "/kds/expo", label: "Expo" },
  { href: "/kds/performance", label: "Station report" },
];

export function KdsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Kitchen display">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-3 py-1 text-sm",
              active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
