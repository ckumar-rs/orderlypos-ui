"use client";

import Link from "next/link";
import { AgentChat } from "@/components/agent/agent-chat";
import { Card } from "@/components/ui/card";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { useBranch } from "@/hooks/use-branch";

export default function RestaurantAgentPage() {
  const { branchId } = useBranch();
  const { data: me } = useCurrentUser();
  const canRestaurant = hasPermission(me?.user, "reports.access");
  if (me && !canRestaurant) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-[32px] font-semibold tracking-tight">Restaurant agent</h1>
        <Card className="p-4 text-sm">
          This chat is for people who can open reports for every branch.{" "}
          <Link href="/agent" className="font-medium text-primary">
            Ask about this branch
          </Link>
        </Card>
      </div>
    );
  }
  return (
    <AgentChat
      branchId={branchId}
      scope="restaurant"
      title="Restaurant agent"
      hint="Ask across every branch. Sales, open orders, late tickets, stock, and reservations are included only where this login can already see them. Phone, email, address, and allergy notes are left out."
      suggestions={[
        "What is happening at the other branches?",
        "Compare sales this month",
        "Which branches have late kitchen tickets?",
        "Where is stock low?",
      ]}
      extra={
        <Link href="/agent" className="text-sm font-medium text-primary">
          Ask about this branch only
        </Link>
      }
    />
  );
}
