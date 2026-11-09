import type { Metadata } from "next";
import {
  ContactChannels,
  MarketingHeroBand,
} from "@/components/site/marketing-page-band";
import { emailAddress, whatsappHref } from "@/components/site/reach-us";
import { SiteFaq } from "@/components/site/site-faq";
import { SiteFrame } from "@/components/site/site-frame";
import { SitePageHero } from "@/components/site/site-page-hero";
import { SiteRelated } from "@/components/site/site-related";
import { relatedCompany, relatedProduct } from "@/components/site/site-related-sets";
import { publicMeta } from "@/lib/seo";

export const metadata: Metadata = publicMeta(
  "/contact",
  "Contact",
  "WhatsApp and phone +91-9346342691. Email info@contrivya.com. OrderlyPOS is made by Contrivya.",
);

const faqs = [
  {
    q: "Is there a call centre?",
    a: "No. A message reaches the people who build OrderlyPOS at Contrivya.",
  },
  {
    q: "Should I create an account first?",
    a: "Not required. WhatsApp, phone, or email works before signup. Creating an account does not charge a card.",
  },
  {
    q: "Enterprise pricing?",
    a: "Write to info@contrivya.com with “OrderlyPOS Enterprise” in the subject, or use the pricing page plan finder.",
  },
];

export default function ContactPage() {
  return (
    <SiteFrame page={{ path: "/contact", name: "Contact" }} showCta={false}>
      <MarketingHeroBand>
        <SitePageHero
          eyebrow="Contact"
          title="Write to the people who build it."
          body="OrderlyPOS does not run a call centre. A message reaches Contrivya — WhatsApp, phone, or email."
          actions={[
            { href: whatsappHref, label: "WhatsApp", primary: true },
            { href: `mailto:${emailAddress}`, label: "Email" },
            { href: "/signup", label: "Try now OrderlyPOS" },
          ]}
        />
      </MarketingHeroBand>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-6">
        <ContactChannels />
      </section>

      <SiteFaq title="Before you write" items={faqs} />
      <SiteRelated items={[relatedProduct[2]!, relatedCompany[0]!, relatedProduct[0]!]} />
    </SiteFrame>
  );
}
