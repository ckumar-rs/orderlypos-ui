"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/marketing", label: "Coupons and happy hour" },
  { href: "/marketing/categories", label: "Category discounts" },
  { href: "/marketing/quantity", label: "Buy and get" },
  { href: "/marketing/conditions", label: "Conditions" },
];

export function PromoNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2">
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
