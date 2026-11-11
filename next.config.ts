import type { NextConfig } from "next";

// Browser only ever talks to ONE origin (this Next.js server) — API calls
// are proxied server-side to the backend. Same reasoning as nodedr-pos:
// this keeps the session cookie first-party, avoiding the cross-origin
// cookie fragility that broke that app's very first version. NOTE: Next
// bakes the rewrite destination at build time, so in Docker this must come
// from a build ARG, not a runtime env var (see nodedr-pos memory).
// Fallback is always local. On Vercel, set BACKEND_URL at build time — a
// local rewrite there returns 404 (DNS_HOSTNAME_RESOLVED_PRIVATE).
const BACKEND_URL = (
  process.env.BACKEND_URL ?? "http://localhost:4001"
).replace(/\/$/, "");
if (
  process.env.VERCEL &&
  /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(BACKEND_URL)
) {
  throw new Error(
    `BACKEND_URL must be a public API URL for Vercel builds (got ${BACKEND_URL}). ` +
      "Set BACKEND_URL in the Vercel project env (Build) and redeploy.",
  );
}

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
  output: "standalone",
  async redirects() {
    return [
      ...marketingPages.map((page) => ({
        source: `/site${page}`,
        destination: `/orderlyPOS${page}`,
        permanent: false,
      })),
      { source: "/site/install", destination: "/orderlyPOS/docs", permanent: false },
      { source: "/orderlyPOS/install", destination: "/orderlyPOS/docs", permanent: false },
    ];
  },
  // socket.io's endpoint is literally "/socket.io/" — the backend 404s on the
  // slash-less form, so Next must not redirect it.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      // Realtime push (socket.io) goes through the same origin too: in
      // production only this web server is reachable, never the backend's
      // own port. socket.io starts with long-polling, which proxies fine.
      // Literal first: an empty :path* would drop the trailing slash.
      { source: "/socket.io/", destination: `${BACKEND_URL}/socket.io/` },
      { source: "/socket.io/:path+", destination: `${BACKEND_URL}/socket.io/:path+` },
    ];
  },
};

export default nextConfig;
