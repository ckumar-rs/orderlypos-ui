import Link from "next/link";

/** Shopify-style brand story as a service-day timeline (from real how-to-use steps). */
const beats = [
  {
    time: "Open",
    title: "Sign in on any staff device",
    body: "Phone, tablet, kiosk, or till. Shared terminals switch staff with a PIN. Managers can require an authenticator.",
  },
  {
    time: "Seat",
    title: "Table, takeaway, QR, or kiosk",
    body: "The floor shows free and seated tables. A guest can also order from the table QR.",
  },
  {
    time: "Ring",
    title: "Send the ticket",
    body: "Modifiers, combos, and discounts go on the bill. The kitchen gets the station ticket.",
  },
  {
    time: "Cook",
    title: "One step at a time",
    body: "Accept, prepare, ready, serve. A reprint is stamped so the line does not cook twice.",
  },
  {
    time: "Pay",
    title: "Print, then take the money",
    body: "Printing does not close the table. Cash, card, UPI, or a mix — change due is shown.",
  },
  {
    time: "Close",
    title: "Count the drawer",
    body: "Cash close, sales, tax, and stock stay on this computer for the shift.",
  },
];

export function HomeServiceDay() {
  return (
    <section className="border-y border-border" aria-labelledby="home-day-title" id="service-day">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <p className="text-sm font-medium text-primary">A service day</p>
        <h2
          id="home-day-title"
          className="mt-3 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-4xl"
        >
          From the door to the drawer.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          One path the floor already knows — written into OrderlyPOS instead of five separate apps.
        </p>
        <ol className="mt-10 border-t border-border">
          {beats.map((beat, index) => (
            <li
              key={beat.time}
              className="grid gap-2 border-b border-border py-6 sm:grid-cols-[5rem_7rem_1fr] sm:gap-6"
            >
              <p className="text-sm tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="text-sm font-medium text-primary">{beat.time}</p>
              <div>
                <h3 className="text-base font-medium">{beat.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{beat.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link
          href="/orderlyPOS/how-to-use"
          className="mt-8 inline-flex text-sm font-medium underline-offset-4 hover:underline"
        >
          Full walkthrough
        </Link>
      </div>
    </section>
  );
}
