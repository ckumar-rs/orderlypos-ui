"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/orders", label: "Board" },
  { href: "/orders/repeat", label: "Repeat" },
  { href: "/orders/transfer", label: "Transfer lines" },
  { href: "/orders/sessions", label: "Table sessions" },
  { href: "/orders/whatsapp", label: "WhatsApp" },
  { href: "/orders/curbside", label: "Curbside" },
  { href: "/orders/conflicts", label: "Conflicts" },
];

export function OrderSectionNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const active = link.href === "/orders" ? pathname === "/orders" : pathname === link.href;
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
