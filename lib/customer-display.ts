// Mirrors the POS cart to a second screen (/customer-display) in another
// window of the same browser origin.
//
// Transport: BroadcastChannel + localStorage (shared across tabs/windows).
// The display also polls storage so it never depends on a single missed event.

export interface DisplayLine {
  name: string;
  quantity: number;
  total: number;
}

export type DisplayState =
  | { kind: "idle" }
  | { kind: "cart"; lines: DisplayLine[]; subtotal: number }
  | { kind: "upi"; total: number; uri: string; payee: string }
  | { kind: "paid"; total: number; method?: string };

export type DisplaySource = "pos" | "checkout";

const CHANNEL = "orderrestro-customer-display";
const STORAGE_KEY = "orderrestro-customer-display-state";

type StoredEnvelope = {
  at: number;
  source: DisplaySource;
  state: DisplayState;
};

function readEnvelope(): StoredEnvelope | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredEnvelope;
  } catch {
    return null;
  }
}

function readStored(): DisplayState | null {
  return readEnvelope()?.state ?? null;
}

/**
 * UPI / paid from checkout must not be clobbered by a POS cart republish
 * (e.g. open-orders polling). Cart/idle from POS may always update other carts.
 */
function shouldAccept(next: DisplayState, source: DisplaySource): boolean {
  const current = readEnvelope();
  if (!current) return true;
  if (source === "checkout") return true;
  if (current.state.kind === "upi" || current.state.kind === "paid") {
    // Allow clearing paid → idle after the thank-you window.
    if (next.kind === "idle" && current.state.kind === "paid") return true;
    return false;
  }
  return true;
}

let publishChannel: BroadcastChannel | null = null;

function channel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!publishChannel) publishChannel = new BroadcastChannel(CHANNEL);
  return publishChannel;
}

export function publishDisplay(
  state: DisplayState,
  source: DisplaySource = "pos",
) {
  if (!shouldAccept(state, source)) return;

  const envelope: StoredEnvelope = { at: Date.now(), source, state };
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    } catch {
      // Private mode / quota — channel may still work.
    }
  }

  channel()?.postMessage(state);
}

export function subscribeDisplay(onState: (s: DisplayState) => void): () => void {
  let lastJson = "";

  const emit = (state: DisplayState | null) => {
    if (!state) return;
    const json = JSON.stringify(state);
    if (json === lastJson) return;
    lastJson = json;
    onState(state);
  };

  emit(readStored());

  let ch: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = (e: MessageEvent<DisplayState>) => emit(e.data);
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      const parsed = JSON.parse(e.newValue) as StoredEnvelope;
      emit(parsed.state);
    } catch {
      // ignore
    }
  };

  // Poll: catches same-tab writers, missed storage events, and late channel joins.
  const poll = window.setInterval(() => emit(readStored()), 400);

  window.addEventListener("storage", onStorage);

  return () => {
    ch?.close();
    window.clearInterval(poll);
    window.removeEventListener("storage", onStorage);
  };
}
