export interface QueuedRequest {
  id: string;
  path: string;
  body: unknown;
  createdAt: string;
}

export function readQueue(storageKey: string): QueuedRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function enqueueRequest(storageKey: string, item: QueuedRequest) {
  const next = [...readQueue(storageKey), item];
  localStorage.setItem(storageKey, JSON.stringify(next));
}

export function writeQueue(storageKey: string, items: QueuedRequest[]) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

export async function flushQueue(
  storageKey: string,
  send: (item: QueuedRequest) => Promise<void>,
) {
  const pending = readQueue(storageKey);
  const succeededIds = new Set<string>();
  const conflicts: QueuedRequest[] = [];
  for (const item of pending) {
    try {
      await send(item);
      succeededIds.add(item.id);
    } catch (error) {
      const status = error && typeof error === 'object' && 'status' in error ? Number(error.status) : 0;
      if (status === 409) {
        succeededIds.add(item.id);
        conflicts.push(item);
      }
      // Keep network failures for the next flush. Items enqueued while this
      // send is in flight stay in localStorage and must not be overwritten.
    }
  }
  const remaining = readQueue(storageKey).filter((item) => !succeededIds.has(item.id));
  writeQueue(storageKey, remaining);
  if (conflicts.length && typeof window !== 'undefined') {
    const key = `${storageKey}:conflicts`;
    const previous = readQueue(key);
    writeQueue(key, [...conflicts, ...previous].slice(0, 20));
  }
  return { sent: succeededIds.size, remaining: remaining.length, conflicts };
}
