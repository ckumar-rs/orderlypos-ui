import { siteUrl } from "@/lib/seo";

export function SiteJsonLd() {
  const origin = siteUrl();
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.contrivya.com/#organization",
        name: "Contrivya",
        url: "https://www.contrivya.com",
        email: "info@contrivya.com",
        telephone: "+91-9346342691",
        logo: `${origin}/logo.png`,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+91-9346342691",
          email: "info@contrivya.com",
          contactType: "customer support",
          availableLanguage: ["English"],
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${origin}/orderlyPOS#software`,
        name: "OrderlyPOS",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: `${origin}/orderlyPOS`,
        description:
          "Agentic restaurant POS for a cafe, a dining room, a kiosk, or a group of branches. The floor runs on a computer in the restaurant. Ask reads that service.",
        publisher: { "@id": "https://www.contrivya.com/#organization" },
        featureList: [
          "Billing, tables, kitchen display, and a guest kiosk",
          "Ask reads the open branch and does not take a payment",
          "Rules check a paid bill, low stock, and today's reservations every five minutes",
          "Reports, the drawer, and journals stay on the restaurant computer",
        ],
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "INR",
          lowPrice: "499",
          highPrice: "2499",
          offerCount: 3,
          url: `${origin}/orderlyPOS/pricing`,
          description:
            "Monthly price per outlet for Starter, Growth, and Pro. Yearly billing is 20% less. Creating an account does not charge a card.",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/orderlyPOS#website`,
        name: "OrderlyPOS",
        url: `${origin}/orderlyPOS`,
        publisher: { "@id": "https://www.contrivya.com/#organization" },
        inLanguage: "en",
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
  );
}
