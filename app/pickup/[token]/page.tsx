"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

interface PickupQueue {
  restaurantName: string;
  branchName: string;
  tickets: Array<{
    orderNumber: string;
    token: string;
    type: string;
    guestName: string | null;
    stage: "WAITING_PAYMENT" | "PREPARING" | "READY";
    createdAt: string;
  }>;
}

const STAGE_LABEL = {
  WAITING_PAYMENT: "Waiting for payment",
  PREPARING: "Preparing",
  READY: "Ready",
} as const;

export default function PickupBoardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const queue = useQuery({
    queryKey: ["pickup-board", token],
    queryFn: () => api.get<PickupQueue>(`/public/pickup/${token}`),
    refetchInterval: 3000,
  });

  if (queue.isLoading) {
    return <p className="p-10 text-center text-muted-foreground">Loading pickup board…</p>;
  }
  if (queue.isError) {
    return (
      <p className="p-10 text-center text-muted-foreground">
        {queue.error instanceof ApiError ? queue.error.message : "This pickup board is not available."}
      </p>
    );
  }

  const data = queue.data!;
  const ready = data.tickets.filter((t) => t.stage === "READY");
  const preparing = data.tickets.filter((t) => t.stage === "PREPARING");
  const waiting = data.tickets.filter((t) => t.stage === "WAITING_PAYMENT");

  return (
    <div className="min-h-screen bg-[#0f1410] px-6 py-8 text-[#f4f7f2]">
      <header className="mb-8 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-white/50">{data.branchName}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{data.restaurantName}</h1>
        <p className="mt-2 text-lg text-white/70">Pickup board</p>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
        <BoardColumn title="Ready" tickets={ready} accent="bg-emerald-400" />
        <BoardColumn title="Preparing" tickets={preparing} accent="bg-amber-300" />
        <BoardColumn title="Waiting for payment" tickets={waiting} accent="bg-sky-300" />
      </div>
    </div>
  );
}

function BoardColumn({
  title,
  tickets,
  accent,
}: {
  title: string;
  tickets: PickupQueue["tickets"];
  accent: string;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${accent}`} />
        <h2 className="text-xl font-medium">{title}</h2>
        <span className="text-sm text-white/50">{tickets.length}</span>
      </div>
      <ul className="flex flex-col gap-3">
        {tickets.map((ticket) => (
          <li
            key={ticket.orderNumber}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
          >
            <p className="text-4xl font-semibold tabular-nums tracking-wide">{ticket.token}</p>
            <p className="mt-1 text-sm text-white/60">
              {ticket.guestName || ticket.type} · {STAGE_LABEL[ticket.stage]}
            </p>
          </li>
        ))}
        {tickets.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center text-sm text-white/40">
            None
          </li>
        ) : null}
      </ul>
    </section>
  );
}
