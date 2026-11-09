import Link from "next/link";

/** Shopify-style utility / announcement strip above the sticky nav. */
export function HomeAnnouncement() {
  return (
    <div className="border-b border-border bg-secondary/40">
      <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-2 text-center text-[13px] text-muted-foreground sm:px-6">
        <span>Plans from ₹2,999 a month</span>
        <span aria-hidden className="hidden text-border sm:inline">
          ·
        </span>
        <span>Phone, tablet, kiosk, or till</span>
        <span aria-hidden className="hidden text-border sm:inline">
          ·
        </span>
        <Link href="/orderlyPOS/pricing" className="font-medium text-foreground underline-offset-4 hover:underline">
          Yearly is 20% less
        </Link>
      </p>
    </div>
  );
}
