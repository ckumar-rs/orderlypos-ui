import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { ReachUs } from "@/components/site/reach-us";
import { SiteJsonLd } from "@/components/site/site-jsonld";
import { SiteNav } from "@/components/site/site-nav";

const highlights = [
  {
    title: "Agent",
    body: "Ask reads the open branch. The reply uses only those figures. It does not take a payment.",
    href: "/orderlyPOS/agent",
    label: "How Ask works",
  },
  {
    title: "Automations",
    body: "Every five minutes, a paid bill, low stock, or today’s reservations can notify the owner.",
    href: "/orderlyPOS/agent",
    label: "Round the clock",
  },
  {
    title: "The floor",
    body: "The till, the kitchen, the tables, and the guest kiosk run on the computer in the restaurant.",
    href: "/orderlyPOS/features",
    label: "Every screen",
  },
  {
    title: "The books",
    body: "Reports, the drawer, and journals stay here. A connector posts only after its host is stored.",
    href: "/orderlyPOS/how-to-use",
    label: "From the door to the drawer",
  },
];

const columns = [
  {
    title: "Product",
    links: [
      { href: "/orderlyPOS/features", label: "Features" },
      { href: "/orderlyPOS/agent", label: "Agentic" },
      { href: "/orderlyPOS/how-to-use", label: "How to use" },
      { href: "/orderlyPOS/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/orderlyPOS/docs", label: "Docs" },
      { href: "/orderlyPOS/blog", label: "Blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/orderlyPOS/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "https://www.contrivya.com", label: "Contrivya" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/orderlyPOS/terms", label: "Terms" },
      { href: "/orderlyPOS/privacy", label: "Privacy" },
    ],
  },
];

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <SiteJsonLd />
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[auto_auto_1fr] items-center gap-x-3 px-5 sm:px-6 lg:flex lg:gap-6">
          <Link href="/orderlyPOS" className="col-start-1 row-start-1 shrink-0">
            <Logo size={28} />
          </Link>
          <SiteNav />
          <div className="col-start-3 row-start-1 flex items-center justify-end gap-2">
            <Link href="/login" className="hidden h-9 items-center px-2 text-sm font-medium sm:inline-flex">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium whitespace-nowrap text-primary-foreground"
            >
              Try now OrderlyPOS
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="max-w-xl text-3xl font-medium tracking-tight text-balance">Try now OrderlyPOS.</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Ask reads the service. A rule keeps checking after close. The floor still rings the bill.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <Link
                href="/signup"
                className="inline-flex h-10 shrink-0 items-center rounded-md bg-primary px-4 text-sm font-medium whitespace-nowrap text-primary-foreground"
              >
                Try now OrderlyPOS
              </Link>
              <ReachUs />
            </div>
          </div>
          <ul className="mt-10 grid border-t border-border sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => (
              <li key={item.title} className="border-b border-border py-6 sm:border-r sm:px-6 sm:first:pl-0 lg:border-b-0 lg:last:border-r-0">
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                <Link href={item.href} className="mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{column.title}</p>
              <ul className="mt-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex py-1.5 text-sm text-foreground hover:underline"
                      {...(link.href.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-6xl px-5 pb-10 text-xs text-muted-foreground sm:px-6">
          OrderlyPOS is made by Contrivya. Plans start at ₹499 a month.
        </p>
      </footer>
    </div>
  );
}
