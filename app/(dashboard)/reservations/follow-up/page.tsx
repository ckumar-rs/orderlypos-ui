"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import { useReservations, type Reservation } from "@/hooks/use-reservations";
import { ApiError, api } from "@/lib/api";

export default function ReservationFollowUpPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const reservations = useReservations(branchId, today);
  return (
    <div className="flex flex-col gap-4">
      <Link href="/reservations" className="text-sm text-muted-foreground">Reservations</Link>
      <div>
        <h1 className="text-2xl font-semibold">Today's follow-up</h1>
        <p className="text-sm text-muted-foreground">Text sends WhatsApp and SMS when each is turned on in Operations. A no-show charges the guest's house account. Collect deposit records the advance on that account.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(reservations.data ?? []).map((row) => (
          <Card key={row.id} className="flex flex-col gap-2 p-4">
            <p className="font-medium">{row.customerName}</p>
            <p className="text-sm text-muted-foreground">{new Date(row.reservedAt).toLocaleTimeString()} · {row.guestCount} guests · {row.status}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => act(branchId, row, "text", () => qc.invalidateQueries({ queryKey: ["reservations", branchId, today] }))}>Text</Button>
              <Button type="button" variant="outline" disabled={row.depositPaid || !Number(row.deposit)} onClick={() => act(branchId, row, "deposit", () => qc.invalidateQueries({ queryKey: ["reservations", branchId, today] }))}>Collect deposit</Button>
              <Button type="button" variant="outline" disabled={row.status === "NO_SHOW"} onClick={() => act(branchId, row, "no-show", () => qc.invalidateQueries({ queryKey: ["reservations", branchId, today] }))}>No-show</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function act(branchId: string | null, row: Reservation, kind: "text" | "no-show" | "deposit", done: () => void) {
  api.post(`/service/reservations/${row.id}/${kind}?branchId=${branchId}`, {})
    .then(() => {
      toast.success(kind === "text" ? "WhatsApp and SMS queued when each is turned on" : kind === "deposit" ? "Deposit recorded" : "No-show fee collected");
      done();
    })
    .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not update"));
}
