import Link from "next/link";

/** Shopify brand / founder story block — real Contrivya positioning. */
export function HomeStory() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20" aria-labelledby="home-story-title" id="story">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Contrivya</p>
          <h2
            id="home-story-title"
            className="mt-3 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-4xl"
          >
            Made by Contrivya. Runs in your restaurant.
          </h2>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
            OrderlyPOS is an agentic restaurant POS for the till, the kitchen, the floor, and the
            books. The floor runs service. The same books are checked every five minutes after close.
            Contrivya builds it. Plans start at ₹2,999 a month.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-start lg:items-end">
          <Link
            href="/orderlyPOS/about"
            className="inline-flex text-sm font-medium underline-offset-4 hover:underline"
          >
            About OrderlyPOS
          </Link>
          <a
            href="https://www.contrivya.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm font-medium underline-offset-4 hover:underline"
          >
            www.contrivya.com
          </a>
          <Link
            href="/contact"
            className="inline-flex text-sm font-medium underline-offset-4 hover:underline"
          >
            Contact
          </Link>
        </div>
      </div>
    </section>
  );
}
