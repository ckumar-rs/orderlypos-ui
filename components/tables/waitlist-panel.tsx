"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCancelWaitlistEntry,
  useCreateWaitlistEntry,
  useSeatWaitlistEntry,
  useUpdateWaitlistEntry,
  useWaitlist,
  type WaitlistEntry,
} from "@/hooks/use-waitlist";
import type { RestaurantTable } from "@/hooks/use-tables";
import { ApiError } from "@/lib/api";

function AddWaitlistDialog({ branchId }: { branchId: string | null }) {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [quotedWaitMinutes, setQuotedWaitMinutes] = useState("15");
  const createEntry = useCreateWaitlistEntry(branchId);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEntry.mutate(
      {
        customerName,
        phone: phone || undefined,
        partySize: Number(partySize),
        quotedWaitMinutes: quotedWaitMinutes ? Number(quotedWaitMinutes) : undefined,
      },
      {
        onSuccess: () => {
          toast.success(`${customerName} added to waitlist`);
          setOpen(false);
          setCustomerName("");
          setPhone("");
          setPartySize("2");
          setQuotedWaitMinutes("15");
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not add"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline">Add to waitlist</Button>} />
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add to waitlist</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="w-name">Name</Label>
            <Input
              id="w-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="w-party">Party size</Label>
              <Input
                id="w-party"
                type="number"
                min="1"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="w-wait">Quoted wait (min)</Label>
              <Input
                id="w-wait"
                type="number"
                min="0"
                value={quotedWaitMinutes}
                onChange={(e) => setQuotedWaitMinutes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="w-phone">Phone</Label>
            <Input id="w-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createEntry.isPending}>
              {createEntry.isPending ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditWaitlistDialog({
  branchId,
  entry,
  open,
  onOpenChange,
}: {
  branchId: string | null;
  entry: WaitlistEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [customerName, setCustomerName] = useState(entry.customerName);
  const [partySize, setPartySize] = useState(String(entry.partySize));
  const updateEntry = useUpdateWaitlistEntry(branchId);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setCustomerName(entry.customerName);
          setPartySize(String(entry.partySize));
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateEntry.mutate(
              {
                id: entry.id,
                dto: { customerName: customerName.trim(), partySize: Number(partySize) },
              },
              {
                onSuccess: () => {
                  toast.success("Waitlist updated");
                  onOpenChange(false);
                },
                onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update"),
              },
            );
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit party</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="we-name">Name</Label>
            <Input id="we-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="we-party">Party size</Label>
            <Input
              id="we-party"
              type="number"
              min="1"
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateEntry.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function WaitlistPanel({
  branchId,
  availableTables,
}: {
  branchId: string | null;
  availableTables: RestaurantTable[];
}) {
  const { data: entries, isLoading } = useWaitlist(branchId);
  const seat = useSeatWaitlistEntry(branchId);
  const cancel = useCancelWaitlistEntry(branchId);
  const [editing, setEditing] = useState<WaitlistEntry | null>(null);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-medium text-foreground">Waitlist</h2>
        <AddWaitlistDialog branchId={branchId} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : entries && entries.length > 0 ? (
        <div className="flex flex-col divide-y divide-border">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{entry.customerName}</span>
                <span className="text-xs text-muted-foreground">
                  {entry.partySize} guests
                  {entry.quotedWaitMinutes ? ` · ~${entry.quotedWaitMinutes} min` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing(entry)}>
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-accent"
                    disabled={seat.isPending}
                  >
                    Seat
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => seat.mutate({ id: entry.id })}>
                      Best table
                    </DropdownMenuItem>
                    {availableTables.map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        onClick={() => seat.mutate({ id: entry.id, tableId: t.id })}
                      >
                        {t.name ?? `Table ${t.number}`}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => cancel.mutate(entry.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-sm text-muted-foreground">No one waiting.</p>
      )}
      {editing && (
        <EditWaitlistDialog
          branchId={branchId}
          entry={editing}
          open={Boolean(editing)}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}
    </Card>
  );
}
