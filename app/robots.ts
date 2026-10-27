import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const privatePaths = [
  "/api/",
  "/dashboard",
  "/pos",
  "/kds",
  "/orders",
  "/settings",
  "/inventory",
  "/accounting",
  "/customers",
  "/tables",
  "/reservations",
  "/reports",
  "/team",
  "/attendance",
  "/marketing",
  "/agent",
  "/delivery",
  "/franchise",
  "/approvals",
  "/operations",
  "/login",
  "/kiosk/",
  "/guest/",
  "/order/",
  "/customer-display",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: privatePaths,
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
