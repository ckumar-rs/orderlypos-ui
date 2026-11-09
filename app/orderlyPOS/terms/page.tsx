import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedSteps, MarketingHeroBand } from "@/components/site/marketing-page-band";
import { SiteFrame } from "@/components/site/site-frame";
import { SitePageHero } from "@/components/site/site-page-hero";
import { SiteRelated } from "@/components/site/site-related";
import { SiteReveal } from "@/components/site/site-motion";
import { publicMeta } from "@/lib/seo";

export const metadata: Metadata = publicMeta(
  "/orderlyPOS/terms",
  "Terms and conditions",
  "The terms for the OrderlyPOS public site and for a plan you take with Contrivya. The software runs on the restaurant's host.",
);

const sections = [
  {
    title: "These terms",
    body: "OrderlyPOS is restaurant software from Contrivya. These terms cover the public site and a plan you take with Contrivya. Creating an account, or writing to info@contrivya.com to start a plan, is acceptance of these terms and of the privacy policy. This page is the agreement. It is not a substitute for advice from your own lawyer or chartered accountant.",
  },
  {
    title: "The software runs in the restaurant",
    body: "OrderlyPOS is installed on a host the restaurant controls. Bills, tickets, stock, reservations, staff records, and guest records stay on that host. Contrivya does not host that database. The restaurant decides who may sign in, which branch they may open, and when a backup is taken.",
  },
  {
    title: "Plans and payment",
    body: "Prices are the ones published on the pricing page, in rupees, per outlet. Yearly billing is 20% less than twelve monthly payments. An extra kiosk is ₹500 to ₹1,200 a month on Pro or Enterprise. A one-time license is ₹25,000, ₹40,000, or ₹60,000 for Starter, Growth, or Pro, plus yearly support quoted by email. The rate a restaurant starts on is the rate it keeps. Creating an account on this install does not charge a card and does not turn those plan limits on. A paid plan starts when Contrivya confirms the plan and the price by email.",
  },
  {
    title: "What the restaurant is responsible for",
    body: "The restaurant is responsible for its guests, its staff, its prices, its tax invoices, and the host the software runs on. A receipt can show the GSTIN and the tax split once those are stored in Settings. Whether that receipt is the restaurant’s tax invoice is a question for its chartered accountant. Staff accounts, PINs, and passkeys are the restaurant’s to issue and to remove.",
  },
  {
    title: "What the software will not pretend to do",
    body: "Ask reads the records and does not take a payment, change a price, edit stock, or send a message. An outside assistant connected with a staff login can act only with that person’s permissions. A card terminal, a printer, a payment gateway, Zomato, Swiggy, a delivery fleet, and Tally stay quiet until Settings stores that address and secret. Contrivya does not warrant that a particular printer or card machine has been proven on the restaurant’s counter.",
  },
  {
    title: "Acceptable use",
    body: "Use the software for the restaurant’s own service. Do not try to read another restaurant’s records, guess another person’s password, or use the kiosk, the API, or MCP to take an action the signed-in person is not allowed to take. Automation rules the restaurant turns on are the restaurant’s messages. A chain stops after three further steps.",
  },
  {
    title: "Stopping",
    body: "The restaurant may stop a monthly or yearly plan by writing to info@contrivya.com. Fees already paid for a period that has started are not refunded unless Contrivya agrees in that reply. A one-time license, once paid and delivered, stays with the restaurant. Contrivya may suspend a hosted conversation or a support plan if these terms are broken. The software already installed on the restaurant’s host is not remotely switched off by this page.",
  },
  {
    title: "Liability",
    body: "OrderlyPOS is provided as the build you install. Contrivya is not liable for lost sales, a wrong tax filing, a guest complaint, or a hardware failure. Nothing in these terms limits liability that Indian law does not allow to be limited.",
  },
  {
    title: "Law and changes",
    body: "Indian law applies. Write to info@contrivya.com about a dispute before starting a case. Contrivya may update these terms. The date on this page is the date of the current text. Continued use of a paid plan after notice of a change is acceptance of the new text.",
  },
];

export default function TermsPage() {
  return (
    <SiteFrame page={{ path: "/orderlyPOS/terms", name: "Terms" }}>
      <MarketingHeroBand>
        <SitePageHero
          eyebrow="27 October 2026"
          title="Terms and conditions"
          body="Contrivya, at www.contrivya.com, offers OrderlyPOS. Questions about these terms go to info@contrivya.com."
          actions={[
            { href: "/orderlyPOS/privacy", label: "Privacy policy", primary: true },
            { href: "/orderlyPOS/pricing", label: "Pricing" },
            { href: "mailto:info@contrivya.com", label: "Email Contrivya" },
          ]}
        />
      </MarketingHeroBand>
      <SiteReveal className="mx-auto max-w-5xl px-5 pb-16 sm:px-6">
        <AnimatedSteps items={sections} markKey="index" />
        <p className="mt-8 text-sm text-muted-foreground">
          How personal data is handled is in the{" "}
          <Link href="/orderlyPOS/privacy" className="font-medium text-foreground underline-offset-4 hover:underline">
            privacy policy
          </Link>
          . India receipts and the restaurant’s own duties as a data fiduciary are in the{" "}
          <Link href="/docs/compliance-india" className="font-medium text-foreground underline-offset-4 hover:underline">
            India compliance notes
          </Link>
          .
        </p>
      </SiteReveal>
      <SiteRelated
        title="Related"
        items={[
          { href: "/orderlyPOS/privacy", title: "Privacy", body: "What the site collects, and what stays on the restaurant host." },
          { href: "/orderlyPOS/pricing", title: "Pricing", body: "Published plan prices and yearly billing." },
          { href: "/contact", title: "Contact", body: "Write to Contrivya about these terms." },
        ]}
      />
    </SiteFrame>
  );
}
