import type { Metadata } from "next";
import Link from "next/link";
import { HomePromises } from "@/components/site/home-promises";
import {
  AboutPillars,
  AboutReach,
  MarketingHeroBand,
} from "@/components/site/marketing-page-band";
import { FEATURE_COUNTS, featureCountLine } from "@/components/site/screens";
import { SiteFrame } from "@/components/site/site-frame";
import { SitePageHero } from "@/components/site/site-page-hero";
import { SiteRelated } from "@/components/site/site-related";
import { relatedLearn, relatedProduct } from "@/components/site/site-related-sets";
import { publicMeta } from "@/lib/seo";

export const metadata: Metadata = publicMeta(
  "/orderlyPOS/about",
  "About",
  `OrderlyPOS is an agentic restaurant POS made by Contrivya. ${featureCountLine}. Plans start at ₹2,999 a month.`,
);

export default function AboutPage() {
  return (
    <SiteFrame
      page={{ path: "/orderlyPOS/about", name: "About" }}
      ctaTitle="Try now OrderlyPOS."
      ctaBody="Creating an account does not charge a card. Plans start at ₹2,999 a month."
    >
      <MarketingHeroBand>
        <SitePageHero
          eyebrow="About"
          title="Made by Contrivya. Runs where service runs."
          body={`OrderlyPOS is an Agentic Restaurant POS — ${FEATURE_COUNTS.modules} modules and ${FEATURE_COUNTS.screens}+ screens for till, kitchen, floor, and books. Phone, tablet, kiosk, or till. Plans start at ₹2,999 a month.`}
          actions={[
            { href: "/signup", label: "Try now OrderlyPOS", primary: true },
            { href: "/orderlyPOS/pricing", label: "See plans" },
            { href: "/contact", label: "Contact" },
          ]}
        />
      </MarketingHeroBand>

      <HomePromises />

      <section className="border-y border-border" aria-label="What Contrivya stands for">
        <AboutPillars />
      </section>

      <AboutReach />

      <p className="mx-auto max-w-6xl px-5 pb-4 text-sm text-muted-foreground sm:px-6">
        Full plan list on{" "}
        <Link href="/orderlyPOS/pricing" className="font-medium text-foreground underline-offset-4 hover:underline">
          pricing
        </Link>
        .
      </p>

      <SiteRelated items={[...relatedProduct.slice(0, 2), relatedLearn[0]!]} />
    </SiteFrame>
  );
}
