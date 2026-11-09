"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranch } from "@/hooks/use-branch";
import { useCustomers } from "@/hooks/use-customers";
import { useGiftCards, useIssueGiftCard, useVoidGiftCard } from "@/hooks/use-gift-cards";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export default function GiftCardsPage() {
  const { branchId } = useBranch();
  const cards = useGiftCards(branchId);
  const issue = useIssueGiftCard(branchId);
  const voidCard = useVoidGiftCard(branchId);
  const customers = useCustomers(branchId);
  const [amount, setAmount] = useState("");
  const [customerId, setCustomerId] = useState("");

  const reset = () => {
    setAmount("");
    setCustomerId("");
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Gift cards</h1>
        <p className="text-sm text-muted-foreground">
          Issue a card for this branch. The code is generated automatically and can be redeemed at checkout.
        </p>
      </div>

      <Card className="grid max-w-3xl gap-2 p-4 sm:grid-cols-3">
        <Input
          aria-label="Amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <select
          aria-label="Customer"
          className="h-10 rounded-md border border-input bg-background px-2 text-sm"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
        >
          <option value="">No customer</option>
          {(customers.data ?? []).map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name || customer.phone || customer.id}
              {customer.name && customer.phone ? ` · ${customer.phone}` : ""}
            </option>
          ))}
        </select>
        <Button
          type="button"
          disabled={!branchId || !amount || Number(amount) <= 0 || issue.isPending}
          onClick={() =>
            issue.mutate(
              {
                initialValue: Number(amount),
                ...(customerId ? { customerId } : {}),
              },
              {
                onSuccess: (card) => {
                  toast.success(`Issued ${card.code}`);
                  reset();
                },
                onError: (error) =>
                  toast.error(error instanceof ApiError ? error.message : "Could not issue the card"),
              },
            )
          }
        >
          {issue.isPending ? "Issuing…" : "Issue card"}
        </Button>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Initial</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(cards.data ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground">
                {cards.isLoading ? "Loading…" : "No gift cards yet."}
              </TableCell>
            </TableRow>
          ) : (
            (cards.data ?? []).map((card) => (
              <TableRow key={card.id}>
                <TableCell className="font-mono text-sm">{card.code}</TableCell>
                <TableCell>{formatCurrency(card.initialValue)}</TableCell>
                <TableCell>{formatCurrency(card.balance)}</TableCell>
                <TableCell>{card.isActive ? "Active" : "Voided"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(card.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {card.isActive ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={voidCard.isPending}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Void gift card ${card.code}? Remaining balance will be cleared.`,
                          )
                        ) {
                          return;
                        }
                        voidCard.mutate(card.id, {
                          onSuccess: () => toast.success(`Voided ${card.code}`),
                          onError: (error) =>
                            toast.error(
                              error instanceof ApiError ? error.message : "Could not void the card",
                            ),
                        });
                      }}
                    >
                      Void
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
