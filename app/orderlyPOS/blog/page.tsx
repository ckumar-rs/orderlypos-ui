import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedPosts, MarketingHeroBand } from "@/components/site/marketing-page-band";
import { SiteFrame } from "@/components/site/site-frame";
import { SitePageHero } from "@/components/site/site-page-hero";
import { SiteRelated } from "@/components/site/site-related";
import { relatedLearn, relatedProduct } from "@/components/site/site-related-sets";
import { SiteReveal } from "@/components/site/site-motion";
import { publicMeta, siteUrl } from "@/lib/seo";

export const metadata: Metadata = publicMeta(
  "/orderlyPOS/blog",
  "Restaurant POS notes",
  "How an order survives a dead line, why a kitchen ticket moves one step at a time, and why printing the bill is not the same as taking the money.",
);

const posts = [
  {
    date: "27 October 2026",
    title: "The order should survive a dead internet line",
    body: "A hosted till stops when the shop’s connection stops. OrderlyPOS keeps the database on a computer in the restaurant, so the floor and the kitchen can finish the tables already open. The website order and the webhooks wait until the line is back. That split is the point of self-hosting: service first, the outside world second.",
  },
  {
    date: "27 October 2026",
    title: "A ticket should move one step at a time",
    body: "The pass is a busy screen. A second tap, or a tablet that woke up late, should not jump a dish from new to served. OrderlyPOS accepts, prepares, marks ready, then serves, and it refuses a step that is not the next one. A reprint is stamped so the station does not cook the same ticket again.",
  },
  {
    date: "27 October 2026",
    title: "Printing the bill is not the same as taking the money",
    body: "Guests ask for the bill, then split it, then pay part in cash and part on UPI. If the print closed the table, the floor would be stuck. OrderlyPOS prints a bill that does not charge anything. The table frees when the payments cover the total. The change due is on the screen before the drawer opens.",
  },
];

function NotesJsonLd() {
  const origin = siteUrl();
  const graph = {
    "@context": "https://schema.org",
    "@graph": posts.map((post) => ({
      "@type": "Article",
      headline: post.title,
      datePublished: "2026-10-27",
      dateModified: "2026-10-27",
      description: post.body,
      image: `${origin}/opengraph-image`,
      mainEntityOfPage: `${origin}/orderlyPOS/blog`,
      author: { "@type": "Organization", name: "Contrivya", url: "https://www.contrivya.com" },
      publisher: { "@id": "https://www.contrivya.com/#organization" },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}

export default function BlogPage() {
  return (
    <SiteFrame page={{ path: "/orderlyPOS/blog", name: "Notes" }}>
      <NotesJsonLd />
      <MarketingHeroBand>
        <SitePageHero
          eyebrow="Blog"
          title="Notes from the build."
          body="Short writing from Contrivya about how OrderlyPOS behaves in service. Product changes ship with the software, not as a separate newsroom."
          actions={[
            { href: "/orderlyPOS/docs", label: "Docs", primary: true },
            { href: "/contact", label: "Ask about a note" },
          ]}
        />
      </MarketingHeroBand>
      <SiteReveal className="mx-auto max-w-3xl px-5 pb-16 sm:px-6">
        <AnimatedPosts posts={posts} />
        <p className="mt-8 text-sm text-muted-foreground">
          Questions about a note go to{" "}
          <Link href="/contact" className="font-medium text-foreground underline-offset-4 hover:underline">
            contact
          </Link>
          .
        </p>
      </SiteReveal>
      <SiteRelated items={[relatedLearn[0]!, relatedProduct[0]!, relatedLearn[1]!]} />
    </SiteFrame>
  );
}
