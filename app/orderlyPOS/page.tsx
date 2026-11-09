import type { Metadata } from "next";
import Link from "next/link";
import { AgentTalk } from "@/components/site/agent-talk";
import { HeroAtmosphere, HeroProductVisual } from "@/components/site/hero-atmosphere";
import { HeroLogo } from "@/components/site/hero-logo";
import {
  HeroIntro,
  HeroIntroItem,
  MotionPress,
  SiteReveal,
} from "@/components/site/site-motion";
import { HomeBuiltFor } from "@/components/site/home-built-for";
import { HomeChannels } from "@/components/site/home-channels";
import { HomeCompare } from "@/components/site/home-compare";
import { HomeConnectors } from "@/components/site/home-connectors";
import { HomeFaq } from "@/components/site/home-faq";
import { HomeIndia } from "@/components/site/home-india";
import { HomeJumpNav } from "@/components/site/home-jump-nav";
import { HomeLaunchFilm } from "@/components/site/home-launch-film";
import { HomeModules } from "@/components/site/home-modules";
import { HomePlanFinder } from "@/components/site/home-plan-finder";
import { HomePricingTease } from "@/components/site/home-pricing-tease";
import { HomeProductTabs } from "@/components/site/home-product-tabs";
import { HomePromises } from "@/components/site/home-promises";
import { HomeResources } from "@/components/site/home-resources";
import { HomeServiceDay } from "@/components/site/home-service-day";
import { HomeStartSteps } from "@/components/site/home-start-steps";
import { HomeStory } from "@/components/site/home-story";
import { HomeWorkflow } from "@/components/site/home-workflow";
import { ProductFrame } from "@/components/site/product-frame";
import { SiteFrame } from "@/components/site/site-frame";
import { SiteRelated } from "@/components/site/site-related";
import { relatedLearn, relatedProduct } from "@/components/site/site-related-sets";
import { publicMeta } from "@/lib/seo";

export const metadata: Metadata = publicMeta(
  "/orderlyPOS",
  "OrderlyPOS | Agentic restaurant POS",
  "OrderlyPOS is the restaurant system for phone, tablet, kiosk, and till. Guests order from a table QR, a kiosk, or a WhatsApp catalog. Plans start at ₹2,999 a month.",
  false,
);

const index = [
  {
    title: "Floor",
    body: "Till, kitchen, tables, reservations, and the guest kiosk. Each screen is from this restaurant.",
    href: "/orderlyPOS/features",
    label: "Every screen",
  },
  {
    title: "Agent",
    body: "Ask reads the open branch. Every five minutes, a paid bill, low stock, or today’s book can notify the owner.",
    href: "/orderlyPOS/agent",
    label: "Round the clock",
  },
  {
    title: "Plans",
    body: "From ₹2,999 a month. Yearly billing is 20% less. Pro includes the self-order kiosk.",
    href: "/orderlyPOS/pricing",
    label: "See plans",
  },
];

export default function SitePage() {
  return (
    <SiteFrame
      page={{ path: "/orderlyPOS", name: "OrderlyPOS" }}
      ctaTitle="Run service on phone, tablet, kiosk, or till."
      ctaBody="Creating an account does not charge a card. Plans start at ₹2,999 a month."
    >
      <section className="relative isolate overflow-hidden lg:min-h-[min(100svh,58rem)]">
        <HeroAtmosphere />
        <HeroIntro className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-5 pt-12 pb-10 sm:px-6 sm:pt-16 lg:min-h-[min(100svh,58rem)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)] lg:gap-6 lg:py-20">
          <HeroIntroItem className="text-left max-lg:text-center">
            <div className="inline-flex items-center gap-3 max-lg:mx-auto">
              <HeroLogo size={48} />
            </div>
            <p className="mt-6 text-sm font-semibold tracking-[0.16em] text-primary uppercase sm:mt-8">
              OrderlyPOS
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-[3.55rem] lg:leading-[1.04]">
              Service that stays sharp from first cover to last drawer.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg max-lg:mx-auto">
              Phone, tablet, kiosk, and till. One sign-in for kitchen, floor, and guest QR. Ask reads
              the night — staff still ring the bill.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 max-lg:justify-center sm:mt-10">
              <MotionPress>
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center rounded-md bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_14px_36px_-12px_rgba(242,101,27,0.9)]"
                >
                  Try now OrderlyPOS
                </Link>
              </MotionPress>
              <p className="text-sm text-muted-foreground">
                From ₹2,999 / month ·{" "}
                <Link
                  href="/orderlyPOS/pricing"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  See plans
                </Link>
              </p>
            </div>
          </HeroIntroItem>
          <HeroIntroItem className="w-full">
            <HeroProductVisual
              primarySrc="/site/admin-pos.png"
              secondarySrc="/site/admin-kds.png"
              alt="OrderlyPOS till in front of the kitchen pass"
            />
          </HeroIntroItem>
        </HeroIntro>
      </section>

      <HomePromises />
      <HomeLaunchFilm />
      <HomeJumpNav />
      <HomeProductTabs />
      <HomeModules />
      <HomeChannels />
      <HomeWorkflow />
      <HomeServiceDay />
      <HomeCompare />

      <SiteReveal className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-sm font-medium text-primary">Service</p>
          <h2 className="mt-3 text-3xl font-medium tracking-tight text-balance sm:text-4xl">
            The floor runs the night.
          </h2>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
            A table opens the live menu. The kitchen splits tickets across Bar, Main Kitchen, and
            Tandoor, and a late ticket is marked on the pass. The guest kiosk sends the same order
            to the counter.
          </p>
          <Link href="/orderlyPOS/features" className="mt-6 inline-flex text-sm font-medium underline-offset-4 hover:underline">
            Every screen
          </Link>
        </div>
        <div className="mx-auto w-full max-w-md">
          <ProductFrame src="/site/admin-pos.png" alt="A table opens the live menu" crop />
        </div>
      </SiteReveal>

      <section className="border-y border-border">
        <SiteReveal className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="mx-auto w-full max-w-xl lg:order-2">
            <AgentTalk embedded />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Agent</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight text-balance sm:text-4xl">
              Ask reads the books. It does not run the till.
            </h2>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
              Staff ask about sales, open orders, late tickets, low stock, and today’s reservations.
              The reply uses only those figures. A rule can still speak to the owner when nobody is
              signed in.
            </p>
            <Link href="/orderlyPOS/agent" className="mt-6 inline-flex text-sm font-medium underline-offset-4 hover:underline">
              Round the clock
            </Link>
          </div>
        </SiteReveal>
      </section>

      <HomeBuiltFor />
      <HomeIndia />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-sm font-medium text-primary">After close</p>
          <h2 className="mt-3 text-3xl font-medium tracking-tight text-balance sm:text-4xl">
            The same records, after the last table.
          </h2>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
            The heat map counts paid bills by weekday and hour. The drawer, expenses, and journals
            stay on this computer. Tally posts only after that host is stored.
          </p>
          <Link href="/orderlyPOS/how-to-use" className="mt-6 inline-flex text-sm font-medium underline-offset-4 hover:underline">
            From the door to the drawer
          </Link>
        </div>
        <div className="mx-auto w-full max-w-md">
          <ProductFrame src="/site/admin-reports.png" alt="Reports show when the restaurant was busy" crop />
        </div>
      </section>

      <HomeConnectors />
      <HomeStartSteps />
      <HomePlanFinder />
      <HomePricingTease />
      <HomeStory />
      <HomeResources />

      <section className="border-t border-border" aria-label="Where to go next">
        <ul className="mx-auto grid max-w-6xl lg:grid-cols-3">
          {index.map((item) => (
            <li key={item.title} className="border-b border-border px-5 py-10 sm:px-6 lg:border-b-0 lg:border-r lg:last:border-r-0">
              <h2 className="text-lg font-medium">{item.title}</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              <Link href={item.href} className="mt-4 inline-flex text-sm font-medium underline-offset-4 hover:underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <HomeFaq />
      <SiteRelated
        title="Explore the product"
        items={[...relatedProduct, ...relatedLearn.slice(0, 1)]}
      />
    </SiteFrame>
  );
}
