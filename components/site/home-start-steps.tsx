import Link from "next/link";

const steps = [
  {
    n: "1",
    title: "Create the restaurant",
    body: "Sign up, add the branch, and set tax and printers from Settings.",
  },
  {
    n: "2",
    title: "Publish the menu",
    body: "Categories, prices, and channels go live for QR, kiosk, and WhatsApp.",
  },
  {
    n: "3",
    title: "Open for service",
    body: "Staff take orders. Ask reads the books. Rules keep checking after close.",
  },
];

/** Shopify-style short path from signup to first service. */
export function HomeStartSteps() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20" aria-labelledby="home-steps-title">
      <p className="text-sm font-medium text-primary">Start</p>
      <h2
        id="home-steps-title"
        className="mt-3 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-4xl"
      >
        From account to open floor.
      </h2>
      <ol className="mt-10 grid border-t border-border lg:grid-cols-3">
        {steps.map((step) => (
          <li
            key={step.n}
            className="border-b border-border py-8 lg:border-r lg:border-b-0 lg:px-6 lg:first:pl-0 lg:last:border-r-0"
          >
            <p className="text-sm font-medium text-primary">{step.n}</p>
            <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/signup"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Try now OrderlyPOS
        </Link>
        <Link
          href="/orderlyPOS/how-to-use"
          className="inline-flex h-10 items-center px-4 text-sm font-medium underline-offset-4 hover:underline"
        >
          From the door to the drawer
        </Link>
      </div>
    </section>
  );
}
