"use client";

import { UserRound, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomers, useFindOrCreateCustomer, type Customer } from "@/hooks/use-customers";
import { ApiError } from "@/lib/api";

export function CustomerPicker({
  branchId,
  customer,
  onSelect,
}: {
  branchId: string | null;
  customer: Customer | null;
  onSelect: (customer: Customer | null) => void;
}) {
  const [search, setSearch] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const { data: matches } = useCustomers(branchId, search.length >= 2 ? search : undefined);
  const findOrCreate = useFindOrCreateCustomer(branchId);

  if (customer) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          <UserRound className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{customer.name ?? customer.phone}</span>
          <span className="text-xs text-muted-foreground">{customer.loyaltyPoints} pts</span>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const attachByPhone = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) {
      toast.error("Enter a phone number with at least 8 digits");
      return;
    }
    findOrCreate.mutate(
      { phone: digits, ...(name.trim() ? { name: name.trim() } : {}) },
      {
        onSuccess: ({ customer: next, created }) => {
          onSelect(next);
          setPhone("");
          setName("");
          toast.success(created ? "Guest profile created" : "Guest attached");
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not attach guest"),
      },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          placeholder="Guest phone"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              attachByPhone();
            }
          }}
        />
        <Input
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          type="button"
          size="sm"
          className="h-9"
          disabled={findOrCreate.isPending}
          onClick={attachByPhone}
        >
          {findOrCreate.isPending ? "…" : "Attach"}
        </Button>
      </div>

      <div className="relative flex items-center gap-2">
        <Input
          placeholder="Or search existing guest…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <AddCustomerDialog branchId={branchId} onCreated={(c) => onSelect(c)} />
        {search.length >= 2 && matches && matches.length > 0 && (
          <div className="absolute top-full z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-md">
            {matches.slice(0, 5).map((m) => (
              <button
                key={m.id}
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-secondary"
                onClick={() => {
                  onSelect(m);
                  setSearch("");
                }}
              >
                <span className="font-medium text-foreground">{m.name ?? "Unnamed"}</span>
                <span className="text-xs text-muted-foreground">
                  {m.phone} · {m.loyaltyPoints} pts
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
