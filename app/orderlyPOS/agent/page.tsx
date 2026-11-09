import type { Metadata } from "next";
import { AgentTalk } from "@/components/site/agent-talk";
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
  "/orderlyPOS/agent",
  "Agentic restaurant POS",
  "Ask reads sales, open orders, late tickets, low stock, and today's reservations. It does not take a payment. Settings chooses whether a message waits for a person or goes out on its own.",
);

const day = [
  {
    mark: "Service",
    title: "Staff ask. The floor still rings the bill.",
    body: "The branch agent answers the open branch: sales today and this month, open orders, late kitchen tickets, low stock, and today’s reservations. The restaurant agent is for people who can open reports. It reads the restaurant’s active branches, and only the topics that login can already see. Phone, email, address, and allergy notes stay out.",
  },
  {
    mark: "5 min",
    title: "A pass runs whether anyone is signed in.",
    body: "Every five minutes an active rule looks for a new paid bill, stock at or below its reorder level, or reservations still on today’s book. Settings → How agents run is the owner’s choice. With a person approving each change, email, SMS, WhatsApp, and a webhook wait as a task. With agents sending the change, those go out when the provider is stored. A notice to staff still arrives either way.",
  },
  {
    mark: "After close",
    title: "The night does not turn the check off.",
    body: "A paid bill is reported when one lands since the last pass. Low stock waits twelve hours before it speaks again. Today’s reservations are reported once that day. One rule can start the next. The chain stops after three further steps.",
  },
];

const steps = [
  {
    title: "One set of records",
    body: "Bills, tickets, stock, reservations, and the books are what the till writes. Ask reads those records for the question in front of it. It does not keep a second restaurant in the chat, and it does not read payroll.",
  },
  {
    title: "A model may phrase the answer",
    body: "When a model URL, model id, and token are stored, it can word the records. A number that is not already in those records is dropped, and the raw records are shown. Weekday forecasts run from past sales with no model when AI is off. Anomaly checks are a local score and never call a model.",
  },
  {
    title: "Ask does not run the till",
    body: "The chat does not take a payment, change a price, edit stock, or send a message. The floor still rings the bill.",
  },
  {
    title: "An outside assistant can act as that person",
    body: "MCP exposes 40 tools. Connected with a staff login, an assistant can open, cancel, and refund orders, assign a driver, update a delivery, clock that person in or out, create a reservation, and edit the menu, the floors, and the tables. Each tool uses the same permission the screen uses.",
  },
];

const faqs = [
  {
    q: "Can Ask take a payment?",
    a: "No. Ask reads sales, tickets, stock, and reservations. Staff still ring the bill on the till.",
  },
  {
    q: "Do rules run when nobody is signed in?",
    a: "Yes. Every five minutes an active rule can look for a paid bill, low stock, or today’s reservations, then notify by the channels Settings allows.",
  },
  {
    q: "What is MCP for?",
    a: "An outside assistant connected with a staff login can use the same permissions as that person on the screen — not a second, wider role.",
  },
];

export default function AgentPage() {
  return (
    <SiteFrame
      page={{ path: "/orderlyPOS/agent", name: "Agent" }}
      ctaTitle="Put Ask on the open branch."
      ctaBody="Ask reads sales and tickets. Staff still ring the bill."
    >
      <MarketingHeroBand>
        <SitePageHero
          eyebrow="Agentic Restaurant POS"
          title="The floor closes. The books keep being checked."
          body="OrderlyPOS is the system on the till, the kitchen, and the kiosk. Ask is how staff read it during service. Around the clock, the same books are checked every five minutes."
          actions={[
            { href: "/signup", label: "Try now OrderlyPOS", primary: true },
            { href: "/orderlyPOS/features", label: "Every screen" },
            { href: "/docs/api", label: "API and MCP" },
          ]}
        />
      </MarketingHeroBand>
      <HomePromises />
      <SiteReveal className="mx-auto max-w-6xl px-5 pb-8 sm:px-6">
        <AgentTalk />
      </SiteReveal>
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-6">
        <AnimatedSteps items={day} markKey="mark" />

        <SiteReveal>
          <h2 className="mt-14 text-2xl font-medium tracking-tight">How that is built</h2>
        </SiteReveal>
        <div className="mt-4">
          <AnimatedSteps items={steps} markKey="index" />
        </div>
      </section>
      <SiteFaq title="About Ask and automations" items={faqs} />
      <SiteRelated items={[...relatedProduct.filter((i) => i.href !== "/orderlyPOS/agent"), relatedLearn[0]!]} />
    </SiteFrame>
  );
}
