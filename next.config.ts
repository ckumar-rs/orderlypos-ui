import type { NextConfig } from "next";

const BACKEND_URL = (
  process.env.BACKEND_URL ?? "https://orderlypos-backend.onrender.com"
).replace(/\/$/, "");
const website = (process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://orderlypos-eight.vercel.app").replace(/\/$/, "");

const marketingPages = [
  "",
  "/features",
  "/agent",
  "/how-to-use",
  "/pricing",
  "/docs",
  "/blog",
  "/about",
  "/terms",
  "/privacy",
];

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  async redirects() {
    const toSite = (path: string) => (website ? `${website}${path}` : path);
    return [
      ...marketingPages.map((page) => ({
        source: `/site${page}`,
        destination: toSite(`/orderlyPOS${page}`),
        permanent: false,
      })),
      { source: "/site/install", destination: toSite("/orderlyPOS/docs"), permanent: false },
      { source: "/orderlyPOS/install", destination: toSite("/orderlyPOS/docs"), permanent: false },
      ...(website
        ? [
            { source: "/orderlyPOS", destination: `${website}/orderlyPOS`, permanent: false },
            { source: "/orderlyPOS/:path*", destination: `${website}/orderlyPOS/:path*`, permanent: false },
            { source: "/contact", destination: `${website}/contact`, permanent: false },
            { source: "/docs", destination: `${website}/docs`, permanent: false },
            { source: "/docs/:path*", destination: `${website}/docs/:path*`, permanent: false },
          ]
        : []),
    ];
  },
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/socket.io/", destination: `${BACKEND_URL}/socket.io/` },
      { source: "/socket.io/:path+", destination: `${BACKEND_URL}/socket.io/:path+` },
    ];
  },
};

export default nextConfig;
