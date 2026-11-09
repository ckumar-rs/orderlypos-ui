import Link from "next/link";

/** Shopify “app ecosystem” framing — connectors stay off until Settings stores them. */
const connectors = [
  {
    title: "WhatsApp",
    body: "Catalog orders land with the rest of the service day.",
  },
  {
    title: "Food platforms",
    body: "Zomato and Swiggy stay quiet until that address and secret are stored.",
  },
  {
    title: "Payments",
    body: "A gateway or card terminal posts only after Settings holds the host.",
  },
  {
    title: "Tally",
    body: "Journals post when that host is stored. The books stay on this computer first.",
  },
  {
    title: "MCP & API",
    body: "Ask and scoped keys use the same permissions as the signed-in screen.",
  },
  {
    title: "Delivery",
    body: "Zones, drivers, and a tracking link for the order that left the restaurant.",
  },
];

export function HomeConnectors() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20" aria-labelledby="home-connectors-title">
      <p className="text-sm font-medium text-primary">Connectors</p>
      <h2
        id="home-connectors-title"
        className="mt-3 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-4xl"
      >
        Plug in what you already use.
      </h2>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        Nothing calls out until Settings stores the address and secret. The floor still runs if a
        connector is off.
      </p>
      <ul className="mt-10 grid border-t border-border sm:grid-cols-2 lg:grid-cols-3">
        {connectors.map((item) => (
          <li
            key={item.title}
            className="border-b border-border py-6 sm:px-6 sm:odd:border-r lg:border-r lg:[&:nth-child(3n)]:border-r-0"
          >
            <h3 className="text-sm font-medium">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </li>
        ))}
      </ul>
      <Link
        href="/orderlyPOS/docs"
        className="mt-8 inline-flex text-sm font-medium underline-offset-4 hover:underline"
      >
        Read the docs
      </Link>
    </section>
  );
}
