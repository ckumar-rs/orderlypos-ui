import type { NextConfig } from "next";

// Browser only ever talks to ONE origin (this Next.js server) — API calls
// are proxied server-side to the backend. Same reasoning as nodedr-pos:
// this keeps the session cookie first-party, avoiding the cross-origin
// cookie fragility that broke that app's very first version. NOTE: Next
// bakes the rewrite destination at build time, so in Docker this must come
// from a build ARG, not a runtime env var (see nodedr-pos memory).
//
// Env fallback is always local. On Vercel, a local destination becomes
// DNS_HOSTNAME_RESOLVED_PRIVATE (login + socket.io 404). Use BACKEND_URL
// when it is public; otherwise the hosted API (same host as vercel.json).
const LOCAL_BACKEND = "http://localhost:4001";
const HOSTED_API = "https://orderlypos-backend.onrender.com";
const BACKEND_URL = (process.env.BACKEND_URL ?? LOCAL_BACKEND).replace(
  /\/$/,
  "",
);
const isLocalBackend =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(BACKEND_URL);
const PROXY_TARGET =
  process.env.VERCEL && isLocalBackend ? HOSTED_API : BACKEND_URL;

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

function backendProxies(target: string) {
  return [
    { source: "/api/:path*", destination: `${target}/api/:path*` },
    // socket.io-client hits both /socket.io and /socket.io/ (trailing slash).
    { source: "/socket.io", destination: `${target}/socket.io/` },
    { source: "/socket.io/", destination: `${target}/socket.io/` },
    { source: "/socket.io/:path+", destination: `${target}/socket.io/:path+` },
  ];
}

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
    return backendProxies(PROXY_TARGET);
  },
};

export default nextConfig;
