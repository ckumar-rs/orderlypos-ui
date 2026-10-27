export interface QueuedTicketStatus {
  id: string;
  body: unknown;
}

/** Replays kitchen status changes that are still waiting on this screen. */
export function applyQueuedStatuses<T extends { id: string; status: string }>(
  tickets: T[],
  queued: QueuedTicketStatus[],
): T[] {
  let rows = tickets;
  for (const item of queued) {
    const status =
      item.body && typeof item.body === "object" && "status" in item.body
        ? String((item.body as { status?: unknown }).status ?? "")
        : "";
    const ticketId = item.id.split(":")[0];
    if (!status || !ticketId) continue;
    rows = rows.map((ticket) =>
      ticket.id === ticketId ? { ...ticket, status: status as T["status"] } : ticket,
    );
  }
  return rows;
}
