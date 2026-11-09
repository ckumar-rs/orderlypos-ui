import Link from "next/link";

/** Shopify Sell / Market / Manage — restaurant jobs in three lines. */
const jobs = [
  {
    title: "Sell",
    body: "QR, kiosk, WhatsApp, and the till take the order. The kitchen gets the ticket.",
    href: "/orderlyPOS/features",
    label: "Every screen",
  },
  {
    title: "Run",
    body: "Floor, reservations, stock, and staff stay on one sign-in for the open branch.",
    href: "/orderlyPOS/how-to-use",
    label: "From the door to the drawer",
  },
  {
    title: "Close",
    body: "Reports, the drawer, and Ask stay after the last table. Rules can still notify the owner.",
    href: "/orderlyPOS/agent",
    label: "Round the clock",
  },
];

export function HomeWorkflow() {
  return (
    <section className="border-y border-border" aria-labelledby="home-workflow-title">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <p className="text-sm font-medium text-primary">One system</p>
        <h2
          id="home-workflow-title"
          className="mt-3 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-4xl"
        >
          Sell. Run. Close.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          The same books from the first order to the cash close — no separate apps for each job.
        </p>
        <ul className="mt-10 grid border-t border-border lg:grid-cols-3">
          {jobs.map((job) => (
            <li
              key={job.title}
              className="border-b border-border py-8 lg:border-r lg:border-b-0 lg:px-6 lg:first:pl-0 lg:last:border-r-0"
            >
              <h3 className="text-lg font-medium">{job.title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{job.body}</p>
              <Link
                href={job.href}
                className="mt-4 inline-flex text-sm font-medium underline-offset-4 hover:underline"
              >
                {job.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
