"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReservation } from "@/hooks/use-reservations";
import type { RestaurantTable } from "@/hooks/use-tables";
import { ApiError } from "@/lib/api";

function defaultDateTimeLocal() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return d.toISOString().slice(0, 16);
}

export function AddReservationDialog({
  branchId,
  tables,
}: {
  branchId: string | null;
  tables: RestaurantTable[];
}) {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [reservedAt, setReservedAt] = useState(defaultDateTimeLocal());
  const [tableId, setTableId] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [deposit, setDeposit] = useState("");
  const [depositPaid, setDepositPaid] = useState(false);
  const [depositReference, setDepositReference] = useState("");
  const [depositMethod, setDepositMethod] = useState<"CASH" | "CARD" | "UPI" | "WALLET" | "HOUSE">("HOUSE");
  const [seating, setSeating] = useState<"" | "INDOOR" | "OUTDOOR">("");

  const createReservation = useCreateReservation(branchId);

  const reset = () => {
    setCustomerName("");
    setPhone("");
    setGuestCount("2");
    setReservedAt(defaultDateTimeLocal());
    setTableId("");
    setSpecialRequests("");
    setDeposit("");
    setDepositPaid(false);
    setDepositReference("");
    setDepositMethod("HOUSE");
    setSeating("");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReservation.mutate(
      {
        customerName,
        phone: phone || undefined,
        guestCount: Number(guestCount),
        reservedAt: new Date(reservedAt),
        durationMinutes: 90,
        tableId: tableId || undefined,
        seating: seating || undefined,
        specialRequests: specialRequests || undefined,
        deposit: deposit ? Number(deposit) : undefined,
        depositPaid,
        depositMethod: deposit ? depositMethod : undefined,
        depositReference: depositReference.trim() || undefined,
      },
      {
        onSuccess: (created) => {
          const notice = (created as { guestNotice?: { whatsappUrl?: string | null } }).guestNotice;
          toast.success(`Reservation added for ${customerName}`);
          if (notice?.whatsappUrl) window.open(notice.whatsappUrl, "_blank", "noopener,noreferrer");
          setOpen(false);
          reset();
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not add reservation"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">New reservation</Button>} />
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New reservation</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="r-name">Customer name</Label>
            <Input
              id="r-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="r-phone">Phone</Label>
              <Input id="r-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="r-guests">Guests</Label>
              <Input
                id="r-guests"
                type="number"
                min="1"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="r-when">Date & time</Label>
            <Input
              id="r-when"
              type="datetime-local"
              value={reservedAt}
              onChange={(e) => setReservedAt(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Table (optional)</Label>
            <Select value={tableId} onValueChange={(v) => setTableId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Best free table" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name ?? `Table ${t.number}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="r-area">Floor area</Label>
            <select id="r-area" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={seating} onChange={(e) => setSeating(e.target.value as "" | "INDOOR" | "OUTDOOR")}>
              <option value="">Any area</option>
              <option value="INDOOR">Indoor</option>
              <option value="OUTDOOR">Outdoor</option>
            </select>
            <p className="text-xs text-muted-foreground">Leave the table blank to assign the smallest free table. An area limits that choice.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="r-deposit">Deposit</Label>
              <Input id="r-deposit" type="number" min="0" step="0.01" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="r-deposit-ref">Deposit reference</Label>
              <Input id="r-deposit-ref" value={depositReference} onChange={(e) => setDepositReference(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={depositPaid} onChange={(e) => setDepositPaid(e.target.checked)} />
            Deposit received
          </label>
          <div className="flex flex-col gap-2">
            <Label htmlFor="r-method">Deposit method</Label>
            <select id="r-method" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={depositMethod} onChange={(e) => setDepositMethod(e.target.value as "CASH" | "CARD" | "UPI" | "WALLET" | "HOUSE")}>
              <option value="HOUSE">House account</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="UPI">UPI</option>
              <option value="WALLET">Store-credit wallet</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="r-notes">Special requests</Label>
            <Textarea
              id="r-notes"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createReservation.isPending}>
              {createReservation.isPending ? "Saving…" : "Save reservation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
