import Link from "next/link";

/** Shopify-style “sell everywhere” — guest and counter channels that OrderlyPOS already runs. */
const channels = [
  {
    title: "Table QR",
    body: "A guest opens the live menu from the table. The same ticket reaches the kitchen.",
  },
  {
    title: "Guest kiosk",
    body: "Self-order at the counter. Options, notes, and payment stay on one flow.",
  },
  {
    title: "WhatsApp catalog",
    body: "The menu lists in WhatsApp. Orders land with the rest of the service day.",
  },
  {
    title: "Counter till",
    body: "Staff take walk-ins, ring the bill, and keep the drawer on this computer.",
  },
];

export function HomeChannels() {
  return (
    <section className="border-y border-border" aria-labelledby="home-channels-title" id="channels">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <p className="text-sm font-medium text-primary">Order channels</p>
        <h2
          id="home-channels-title"
          className="mt-3 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-4xl"
        >
          Guests order where they already are.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          One menu, one kitchen, one sign-in. Table QR, kiosk, WhatsApp, and the till write the same
          books.
        </p>
        <ul className="mt-10 grid border-t border-border sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((channel) => (
            <li
              key={channel.title}
              className="border-b border-border py-6 sm:border-r sm:px-6 sm:first:pl-0 lg:border-b-0 lg:last:border-r-0"
            >
              <h3 className="text-sm font-medium">{channel.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{channel.body}</p>
            </li>
          ))}
        </ul>
        <Link
          href="/orderlyPOS/features"
          className="mt-8 inline-flex text-sm font-medium underline-offset-4 hover:underline"
        >
          Every screen
        </Link>
      </div>
    </section>
  );
}
