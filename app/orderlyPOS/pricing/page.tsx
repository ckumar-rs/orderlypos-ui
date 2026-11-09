import type { Metadata } from "next";
import { HomePlanFinder } from "@/components/site/home-plan-finder";
import { HomePromises } from "@/components/site/home-promises";
import { FeatureCountStrip, MarketingHeroBand } from "@/components/site/marketing-page-band";
import { PricePlans } from "@/components/site/price-plans";
import { FEATURE_COUNTS, featureCountLine } from "@/components/site/screens";
import { SiteFrame } from "@/components/site/site-frame";
import { SitePageHero } from "@/components/site/site-page-hero";
import { SiteRelated } from "@/components/site/site-related";
import { SiteReveal } from "@/components/site/site-motion";
import { relatedCompany, relatedLearn, relatedProduct } from "@/components/site/site-related-sets";
import { publicMeta } from "@/lib/seo";

export const metadata: Metadata = publicMeta(
  "/orderlyPOS/pricing",
  "Restaurant POS pricing",
  `Starter ₹2,999 or $36, Growth ₹4,999 or $60, Pro ₹6,999 or $84, and Enterprise ₹12,999 or $156 a month per outlet. ${featureCountLine}. Yearly billing is 20% less.`,
);

export default function PricingPage() {
  return (
    <SiteFrame
      page={{ path: "/orderlyPOS/pricing", name: "Pricing" }}
      ctaTitle="Creating an account does not charge a card."
      ctaBody="A paid plan starts when Contrivya confirms it by email. Yearly is 20% less."
    >
      <MarketingHeroBand>
        <SitePageHero
          eyebrow="Pricing"
          title="Pick a plan that fits this outlet."
          body={`Starter ₹2,999 · Growth ₹4,999 · Pro ₹6,999 · Enterprise ₹12,999 a month per outlet (or USD list). Yearly is 20% less. ${FEATURE_COUNTS.modules} modules on every paid path — Growth is where most small restaurants start.`}
          actions={[
            { href: "/signup", label: "Try now OrderlyPOS", primary: true },
            { href: "#plan-finder", label: "Find a plan" },
            { href: "/contact", label: "Ask about Enterprise" },
          ]}
        />
      </MarketingHeroBand>

      <FeatureCountStrip />

      <HomePromises />

      <SiteReveal className="mx-auto max-w-6xl px-5 pb-8 sm:px-6">
        <PricePlans />
      </SiteReveal>

      <HomePlanFinder />

      <SiteRelated
        items={[relatedProduct[0]!, relatedLearn[0]!, relatedCompany[1]!]}
      />
    </SiteFrame>
  );
}
