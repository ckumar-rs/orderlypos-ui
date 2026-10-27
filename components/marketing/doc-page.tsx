import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { SiteJsonLd } from "@/components/site/site-jsonld";

export function DocPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteJsonLd />
      <header className="border-b border-border/60 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo size={30} />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/orderlyPOS" className="text-sm text-muted-foreground hover:text-foreground">
              Site
            </Link>
            <Link href="/signup" className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium whitespace-nowrap text-primary-foreground">
              Try now OrderlyPOS
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
        <div className="mt-10 flex flex-col gap-10">{children}</div>
      </main>
    </div>
  );
}

export function DocSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{heading}</h2>
      <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function DocList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-5 flex list-disc flex-col gap-1.5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}
