import Link from "next/link";

/** Shopify Markets parallel — India-ready operations already in the product. */
const points = [
  {
    title: "Tax regimes",
    body: "GST and other tax modes live in Settings — not hardcoded in the till.",
  },
  {
    title: "UPI and split tender",
    body: "Cash, card, UPI, or a mix on one bill. Change due is shown before the table frees.",
  },
  {
    title: "WhatsApp catalog",
    body: "Guests order from the channel they already use. Tickets join the same kitchen.",
  },
  {
    title: "Tally when ready",
    body: "Journals post only after that host is stored. The books stay on this computer first.",
  },
];

export function HomeIndia() {
  return (
    <section className="border-y border-border" aria-labelledby="home-india-title" id="india">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <p className="text-sm font-medium text-primary">Built for India service</p>
        <h2
          id="home-india-title"
          className="mt-3 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-4xl"
        >
          Tax, UPI, WhatsApp, and Tally — on your terms.
        </h2>
        <ul className="mt-10 grid border-t border-border sm:grid-cols-2">
          {points.map((point) => (
            <li
              key={point.title}
              className="border-b border-border py-6 sm:border-r sm:px-6 sm:odd:pr-6 sm:even:pl-6 lg:odd:pl-0"
            >
              <h3 className="text-sm font-medium">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
            </li>
          ))}
        </ul>
        <Link
          href="/orderlyPOS/docs"
          className="mt-8 inline-flex text-sm font-medium underline-offset-4 hover:underline"
        >
          India receipts and docs
        </Link>
      </div>
    </section>
  );
}
