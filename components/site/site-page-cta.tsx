import Link from "next/link";
import { ReachUs } from "@/components/site/reach-us";

/** Shopify bottom conversion band for product pages. */
export function SitePageCta({
  title = "Try now OrderlyPOS.",
  body = "Creating an account does not charge a card. Plans start at ₹2,999 a month.",
  primaryHref = "/signup",
  primaryLabel = "Try now OrderlyPOS",
  secondaryHref = "/orderlyPOS/pricing",
  secondaryLabel = "See plans",
}: {
  title?: string;
  body?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-16 sm:px-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="max-w-xl text-3xl font-medium tracking-tight text-balance">{title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium"
            >
              {secondaryLabel}
            </Link>
          </div>
          <ReachUs />
        </div>
      </div>
    </section>
  );
}
