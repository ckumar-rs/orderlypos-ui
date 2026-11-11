import type { ManagerOptions, SocketOptions } from "socket.io-client";

// NEXT_PUBLIC_* vars are inlined at build time, so a literal default here
// would bake in whatever host built the bundle (e.g. "localhost") — every
// OTHER device on the LAN (another till, a tablet) would then try to reach
// its OWN localhost instead of the actual server, silently breaking
// realtime push on every device but the one that ran `next build`. Falling
// back to the browser's own current hostname at connect time instead means
// this works correctly from any device that loaded the page from the real
// server address, with no per-deployment env var required. Shared by every
// socket.io-client consumer (use-realtime.ts, notification-bell.tsx,
// use-kds-sound.ts) so the fallback logic only lives in one place.
export function resolveWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (typeof window !== "undefined") {
    // Always this same origin, over HTTP or HTTPS: next.config.ts proxies
    // /socket.io to the backend, and in the shipped compose stack the
    // backend's own port is NOT published, so the old http-> ":4001"
    // fallback could never connect from another device on the LAN (the
    // kitchen tablet's live ticket updates silently fell back to polling).
    return window.location.origin;
  }
  return "http://localhost:4001";
}

function hostedBehindVercelProxy(): boolean {
  if (typeof window === "undefined") return false;
  return /\.vercel\.app$/i.test(window.location.hostname);
}

// Vercel HTTP rewrites can proxy Engine.IO polling to Render, but they do
// not complete WebSocket upgrades to an external origin. Leave websocket
// enabled for local/docker (Next proxies WS fine); on *.vercel.app stay on
// polling so the client does not spam failed wss:// upgrades.
export function socketIoClientOptions(
  extra: Partial<ManagerOptions & SocketOptions> = {},
): Partial<ManagerOptions & SocketOptions> {
  const vercel = hostedBehindVercelProxy();
  return {
    withCredentials: true,
    ...(vercel ? { transports: ["polling"], upgrade: false } : {}),
    ...extra,
  };
}
