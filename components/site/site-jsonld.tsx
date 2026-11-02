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
          "Guests order by table QR, on a kiosk, or from a WhatsApp catalog",
          "Billing, tables, kitchen display, and a guest kiosk",
          "Ask reads the open branch and does not take a payment",
          "The owner chooses whether agents draft a change or send it",
          "Reports, the drawer, and journals stay on the restaurant computer",
        ],
        offers: [
          {
            "@type": "Offer",
            name: "Starter",
            price: "2999",
            priceCurrency: "INR",
            url: `${origin}/orderlyPOS/pricing`,
            description: "Monthly price per outlet. Yearly billing is 20% less. Creating an account does not charge a card.",
          },
          {
            "@type": "Offer",
            name: "Growth",
            price: "4999",
            priceCurrency: "INR",
            url: `${origin}/orderlyPOS/pricing`,
            description: "Monthly price per outlet. Yearly billing is 20% less.",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "6999",
            priceCurrency: "INR",
            url: `${origin}/orderlyPOS/pricing`,
            description: "Monthly price per outlet. Includes the self-order kiosk. Yearly billing is 20% less.",
          },
          {
            "@type": "Offer",
            name: "Enterprise",
            price: "12999",
            priceCurrency: "INR",
            url: `${origin}/orderlyPOS/pricing`,
            description: "Monthly price per outlet for a group of branches. Yearly billing is 20% less.",
          },
          {
            "@type": "Offer",
            name: "Starter",
            price: "36",
            priceCurrency: "USD",
            url: `${origin}/orderlyPOS/pricing`,
            description: "Monthly list price per outlet in US dollars. Yearly billing is 20% less.",
          },
          {
            "@type": "Offer",
            name: "Growth",
            price: "60",
            priceCurrency: "USD",
            url: `${origin}/orderlyPOS/pricing`,
            description: "Monthly list price per outlet in US dollars. Yearly billing is 20% less.",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "84",
            priceCurrency: "USD",
            url: `${origin}/orderlyPOS/pricing`,
            description: "Monthly list price per outlet in US dollars. Includes the self-order kiosk. Yearly billing is 20% less.",
          },
          {
            "@type": "Offer",
            name: "Enterprise",
            price: "156",
            priceCurrency: "USD",
            url: `${origin}/orderlyPOS/pricing`,
            description: "Monthly list price per outlet in US dollars for a group of branches. Yearly billing is 20% less.",
          },
        ],
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

export function PageJsonLd({ path, name }: { path: string; name: string }) {
  const origin = siteUrl();
  const pageUrl = `${origin}${path}`;
  const home = `${origin}/orderlyPOS`;
  const crumbs: { "@type": "ListItem"; position: number; name: string; item: string }[] = [
    { "@type": "ListItem", position: 1, name: "OrderlyPOS", item: home },
  ];
  if (path !== "/orderlyPOS") {
    crumbs.push({ "@type": "ListItem", position: 2, name, item: pageUrl });
  }
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name,
        isPartOf: { "@id": `${home}#website` },
        about: { "@id": `${home}#software` },
        inLanguage: "en",
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: crumbs,
      },
    ],
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
  );
}
