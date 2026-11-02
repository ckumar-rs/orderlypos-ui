import type { MetadataRoute } from "next";
import { publicPaths, siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  const lastModified = new Date("2026-11-02");
  return publicPaths.map((path) => ({
    url: `${origin}${path}`,
    lastModified,
  }));
}
