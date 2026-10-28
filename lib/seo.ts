import type { Metadata } from "next";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://orderlypos-ui.vercel.app").replace(/\/$/, "");
}

const shareImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "OrderlyPOS. Open for service. Still checking after close.",
};

export function publicMeta(path: string, title: string, description: string, branded = true): Metadata {
  const fullTitle = branded ? `${title} | OrderlyPOS` : title;
  return {
    title: branded ? title : { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: { title: fullTitle, description, url: path, type: "website", images: [shareImage] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [shareImage.url] },
  };
}

export const publicPaths = [
  "/orderlyPOS",
  "/orderlyPOS/features",
  "/orderlyPOS/agent",
  "/orderlyPOS/how-to-use",
  "/orderlyPOS/pricing",
  "/orderlyPOS/docs",
  "/orderlyPOS/blog",
  "/orderlyPOS/about",
  "/orderlyPOS/terms",
  "/orderlyPOS/privacy",
  "/contact",
  "/signup",
  "/docs",
  "/docs/api",
  "/docs/accessibility",
  "/docs/compliance-india",
] as const;
