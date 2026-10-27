"use client";

import { useState } from "react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    who: "Cafes, food trucks, and a first trial",
    lead: "Can begin at no charge while you try it.",
    monthly: 499,
    points: ["Basic billing", "A short menu", "1 terminal"],
    href: "/signup",
    featured: false,
  },
  {
    name: "Growth",
    who: "QSRs and small dining rooms",
    lead: "Everything in Starter, and:",
    monthly: 999,
    points: ["Full billing", "Basic reports", "1–2 devices", "Kitchen display basics"],
    href: "/signup",
    featured: false,
  },
  {
    name: "Pro",
    who: "Self-ordering and a busier service",
    lead: "Everything in Growth, and:",
    monthly: 2499,
    points: ["Several devices", "Kiosk ordering", "Inventory and loyalty", "Priority support"],
    href: "/signup",
    featured: true,
  },
  {
    name: "Enterprise",
    who: "Chains and more than one location",
    lead: "Everything in Pro, and:",
    monthly: null as number | null,
    points: ["Central dashboard", "Integrations", "A named contact"],
    href: "mailto:info@contrivya.com?subject=OrderlyPOS%20Enterprise",
    featured: false,
  },
];

type Row =
  | { kind: "group"; label: string }
  | { kind: "feature"; label: string; values: [string, string, string, string] };

const rows: Row[] = [
  { kind: "group", label: "Service" },
  { kind: "feature", label: "Billing", values: ["Basic", "Full", "Full", "Full"] },
  { kind: "feature", label: "Menu", values: ["Short", "Full", "Full", "Full"] },
  { kind: "feature", label: "Discounts, combos, and split tender", values: ["—", "✓", "✓", "✓"] },
  { kind: "feature", label: "Bill prints before it is paid", values: ["✓", "✓", "✓", "✓"] },
  { kind: "group", label: "Floor" },
  { kind: "feature", label: "Devices", values: ["1 terminal", "1–2", "Several", "Every branch"] },
  { kind: "feature", label: "Tables and the floor plan", values: ["—", "✓", "✓", "✓"] },
  { kind: "feature", label: "Reservations", values: ["—", "✓", "✓", "✓"] },
  { kind: "feature", label: "Kitchen display", values: ["—", "Basics", "Included", "Included"] },
  { kind: "feature", label: "Guest kiosk", values: ["—", "—", "Included", "Included"] },
  { kind: "feature", label: "Extra kiosk", values: ["—", "—", "₹500–₹1,200", "₹500–₹1,200"] },
  { kind: "group", label: "Books and guests" },
  { kind: "feature", label: "Reports", values: ["—", "Basic", "Full", "Central"] },
  { kind: "feature", label: "Drawer and expenses", values: ["—", "✓", "✓", "✓"] },
  { kind: "feature", label: "Inventory", values: ["—", "—", "✓", "✓"] },
  { kind: "feature", label: "Loyalty", values: ["—", "—", "✓", "✓"] },
  { kind: "feature", label: "Tally and other connectors", values: ["When stored", "When stored", "When stored", "When stored"] },
  { kind: "group", label: "Agent" },
  { kind: "feature", label: "Ask, read only", values: ["✓", "✓", "✓", "✓"] },
  { kind: "feature", label: "Rules every five minutes", values: ["✓", "✓", "✓", "✓"] },
  { kind: "feature", label: "MCP, same permissions as the screen", values: ["✓", "✓", "✓", "✓"] },
  { kind: "group", label: "Branches" },
  { kind: "feature", label: "Outlets", values: ["1", "1", "1", "Every branch"] },
  { kind: "feature", label: "Central dashboard", values: ["—", "—", "—", "✓"] },
  { kind: "feature", label: "Franchise view", values: ["—", "—", "—", "✓"] },
  { kind: "group", label: "Support" },
  { kind: "feature", label: "Support", values: ["Email", "Email", "Priority", "Named contact"] },
  { kind: "feature", label: "One-time license", values: ["₹25,000", "₹40,000", "₹60,000", "Quote"] },
  { kind: "feature", label: "The rate you start on is the rate you keep", values: ["✓", "✓", "✓", "✓"] },
];

const questions = [
  {
    q: "Which plan fits this restaurant?",
    a: "Starter is for a trial, a cafe, or a food truck. Growth is the plan most small restaurants start on: full billing, basic reports, and the kitchen display. Pro adds the self-order kiosk, inventory, and loyalty. A group of branches should ask for Enterprise.",
  },
  {
    q: "What does Try now OrderlyPOS do?",
    a: "It opens account creation. Creating an account does not charge a card, and it does not turn plan limits on. A paid plan starts when Contrivya confirms it by email.",
  },
  {
    q: "How does yearly billing work?",
    a: "Yearly billing is 20% less than twelve monthly payments. The prices above switch when you choose Monthly or Yearly. Yearly is the usual way a restaurant pays.",
  },
  {
    q: "Can Starter begin at no charge?",
    a: "Yes, while you try it. The rate you start on is the rate you keep.",
  },
  {
    q: "What about a one-time license?",
    a: "Pay once, then a yearly support fee quoted by email. Starter is ₹25,000, Growth is ₹40,000, and Pro is ₹60,000.",
  },
  {
    q: "What does an extra kiosk cost?",
    a: "Each extra self-order screen is ₹500 to ₹1,200 a month, on top of Pro or Enterprise. The guest reviews the order on the kiosk and pays at the counter.",
  },
  {
    q: "Who do I write to?",
    a: "info@contrivya.com. Enterprise, a one-time license, and the support fee are quoted from that address.",
  },
];

const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function perMonth(monthly: number, yearly: boolean) {
  return yearly ? Math.round(monthly * 0.8) : monthly;
}

function perYear(monthly: number) {
  return Math.round(monthly * 12 * 0.8);
}

function Cell({ value }: { value: string }) {
  if (value === "✓") return <span aria-label="Included">✓</span>;
  if (value === "—") return <span className="text-muted-foreground" aria-label="Not included">—</span>;
  return <span>{value}</span>;
}

function TryNow({ href, filled }: { href: string; filled?: boolean }) {
  const className = filled
    ? "inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
    : "inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        Try now OrderlyPOS
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      Ask for a quote
    </a>
  );
}

export function PricePlans() {
  const [yearly, setYearly] = useState(true);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-border p-1" role="group" aria-label="Billing period">
          <button
            type="button"
            aria-pressed={!yearly}
            onClick={() => setYearly(false)}
            className={!yearly ? "rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background" : "rounded-md px-3 py-1.5 text-sm text-muted-foreground"}
          >
            Monthly
          </button>
          <button
            type="button"
            aria-pressed={yearly}
            onClick={() => setYearly(true)}
            className={yearly ? "rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background" : "rounded-md px-3 py-1.5 text-sm text-muted-foreground"}
          >
            Yearly
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Yearly billing is 20% less. That is how most restaurants pay.</p>
      </div>

      <div className="mt-10 grid gap-px bg-border md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const amount = plan.monthly == null ? null : perMonth(plan.monthly, yearly);
          return (
            <article key={plan.name} className="flex flex-col bg-background p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-medium">{plan.name}</h2>
                {plan.featured ? (
                  <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">Most popular</span>
                ) : null}
              </div>
              <p className="mt-4 text-3xl font-medium tracking-tight tabular-nums">
                {amount == null ? "From ₹8,000" : rupee.format(amount)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {amount == null
                  ? "a month, quoted for the group"
                  : yearly
                    ? `${rupee.format(perYear(plan.monthly!))} billed once a year`
                    : "a month"}
              </p>
              <div className="mt-5">
                <TryNow href={plan.href} filled={plan.featured} />
              </div>
              <p className="mt-6 text-sm text-muted-foreground">{plan.lead}</p>
              <p className="mt-3 text-sm leading-relaxed">{plan.who}</p>
              <ul className="mt-4 flex flex-col gap-2">
                {plan.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm">
                    <span aria-hidden className="text-primary">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Prices are in rupees, per outlet. Creating an account does not charge a card or turn these limits on.
        A paid plan starts when Contrivya confirms it by email.
      </p>

      <h2 className="mt-20 text-2xl font-medium tracking-tight sm:text-3xl">Compare features across plans</h2>
      <div className="mt-6 overflow-x-auto border border-border">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="sticky top-14 bg-background">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Feature</th>
              {plans.map((plan) => {
                const amount = plan.monthly == null ? null : perMonth(plan.monthly, yearly);
                return (
                  <th key={plan.name} className="px-4 py-3 align-top font-medium">
                    <span className="block">{plan.name}</span>
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      {amount == null ? "From ₹8,000/mo" : `${rupee.format(amount)}/mo`}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              row.kind === "group" ? (
                <tr key={row.label} className="border-b border-border bg-secondary">
                  <th colSpan={5} className="px-4 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {row.label}
                  </th>
                </tr>
              ) : (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <th className="px-4 py-3 font-medium">{row.label}</th>
                  {row.values.map((value, index) => (
                    <td key={`${row.label}-${index}`} className="px-4 py-3 text-muted-foreground">
                      <Cell value={value} />
                    </td>
                  ))}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-20 text-2xl font-medium tracking-tight sm:text-3xl">Questions and answers</h2>
      <div className="mt-4 max-w-3xl border-t border-border">
        {questions.map((item) => (
          <details key={item.q} className="group border-b border-border">
            <summary className="cursor-pointer py-4 text-base font-medium">{item.q}</summary>
            <p className="max-w-prose pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-20 flex flex-col gap-6 border-t border-border pt-16 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="max-w-xl text-3xl font-medium tracking-tight text-balance sm:text-4xl">
          Try now OrderlyPOS.
        </h2>
        <TryNow href="/signup" filled />
      </div>
    </div>
  );
}
