import type { Metadata } from "next";
import { HomePromises } from "@/components/site/home-promises";
import { AnimatedSteps, MarketingHeroBand } from "@/components/site/marketing-page-band";
import { SiteFaq } from "@/components/site/site-faq";
import { SiteFrame } from "@/components/site/site-frame";
import { SitePageHero } from "@/components/site/site-page-hero";
import { SiteRelated } from "@/components/site/site-related";
import { relatedLearn, relatedProduct } from "@/components/site/site-related-sets";
import { SiteReveal } from "@/components/site/site-motion";
import { publicMeta } from "@/lib/seo";

export const metadata: Metadata = publicMeta(
  "/orderlyPOS/how-to-use",
  "How to use a restaurant POS",
  "Sign in on phone, tablet, kiosk, or till, seat a table or start a takeaway, ring the order, cook one step at a time, print the bill, then take the money.",
);

const steps = [
  {
    title: "Sign in on any staff device",
    body: "Open the till in the browser on a phone, tablet, kiosk, or computer. Shared terminals can switch staff with a PIN. Managers can require an authenticator code.",
  },
  {
    title: "Seat the table, or start a takeaway",
    body: "The floor shows which tables are free, seated, or waiting on the bill. A reservation or a waitlist name can move onto a table. A guest at the table can also order from the QR or kiosk screen.",
  },
  {
    title: "Ring the order",
    body: "Add dishes, modifiers, and combos. A discount shows as a percentage and as money, and the tax follows. Send the ticket. The kitchen receives it on the station that cooks it.",
  },
  {
    title: "Cook one step at a time",
    body: "The pass accepts, prepares, marks ready, then serves. A ticket cannot skip a step. A reprint is marked so the line does not cook it twice. Online orders wait to be accepted before they join the pass.",
  },
  {
    title: "Print the bill, then take the money",
    body: "Printing the bill does not close the table. Take cash, card, UPI, or a mix, including a part payment. Change due is shown. The table frees when the bill is settled.",
  },
  {
    title: "Close the night on your own books",
    body: "Count the drawer. The cash close records the variance. Sales, tax, and stock for the shift stay on the restaurant host. Reports can be printed or exported.",
  },
];

const faqs = [
  {
    q: "Does printing the bill close the table?",
    a: "No. Guests can still split or pay in parts. The table frees when payments cover the total.",
  },
  {
    q: "Where does service run?",
    a: "On phone, tablet, kiosk, or computer against the restaurant host. The floor and kitchen can finish open tables even if the outside line drops.",
  },
  {
    q: "Where are longer notes?",
    a: "API, accessibility, and India receipt notes live in the docs that ship with the install.",
  },
];

export default function HowToUsePage() {
  return (
    <SiteFrame
      page={{ path: "/orderlyPOS/how-to-use", name: "How to use" }}
      ctaTitle="Open the till on any staff device."
      ctaBody="Phone, tablet, kiosk, or computer. Creating an account does not charge a card."
    >
      <MarketingHeroBand>
        <SitePageHero
          eyebrow="How to use"
          title="One service, from the door to the drawer."
          body="Sign in on any staff device, seat a table or start a takeaway, ring the order, cook one step at a time, print the bill, then take the money."
          actions={[
            { href: "/signup", label: "Try now OrderlyPOS", primary: true },
            { href: "/orderlyPOS/features", label: "Every screen" },
            { href: "/orderlyPOS/docs", label: "Docs" },
          ]}
        />
      </MarketingHeroBand>
      <HomePromises />
      <SiteReveal className="mx-auto max-w-6xl px-5 pb-16 sm:px-6">
        <AnimatedSteps items={steps} markKey="index" />
      </SiteReveal>
      <SiteFaq title="About a service day" items={faqs} />
      <SiteRelated items={[relatedProduct[0]!, relatedLearn[1]!, relatedProduct[1]!]} />
    </SiteFrame>
  );
}
