import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "₹2,999",
    who: "Cafe, truck, or a first trial",
  },
  {
    name: "Growth",
    price: "₹4,999",
    who: "Full billing and kitchen basics",
    note: "Most small restaurants start here",
  },
  {
    name: "Pro",
    price: "₹6,999",
    who: "Kiosk, inventory, and loyalty",
  },
];

/** Shopify “pick a plan” tease without dumping the full matrix on the home page. */
export function HomePricingTease() {
  return (
    <section className="border-y border-border" aria-labelledby="home-pricing-title">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Pricing</p>
            <h2
              id="home-pricing-title"
              className="mt-3 max-w-xl text-3xl font-medium tracking-tight text-balance sm:text-4xl"
            >
              Pick a plan that fits this outlet.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Per outlet, monthly. Yearly billing is 20% less. USD prices are on the pricing page.
            </p>
          </div>
          <Link
            href="/orderlyPOS/pricing"
            className="inline-flex h-10 shrink-0 items-center text-sm font-medium underline-offset-4 hover:underline"
          >
            Full comparison
          </Link>
        </div>
        <ul className="mt-10 grid border-t border-border lg:grid-cols-3">
          {plans.map((plan) => (
            <li
              key={plan.name}
              className="flex flex-col border-b border-border py-8 lg:border-r lg:border-b-0 lg:px-6 lg:first:pl-0 lg:last:border-r-0"
            >
              <h3 className="text-lg font-medium">{plan.name}</h3>
              <p className="mt-3 text-2xl font-medium tracking-tight">
                {plan.price}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/ month</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.who}</p>
              {plan.note ? (
                <p className="mt-3 text-xs font-medium text-primary">{plan.note}</p>
              ) : null}
              <Link
                href="/signup"
                className="mt-6 inline-flex text-sm font-medium underline-offset-4 hover:underline"
              >
                Try now OrderlyPOS
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
