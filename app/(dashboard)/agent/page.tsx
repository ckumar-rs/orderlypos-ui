"use client";

import Link from "next/link";
import { AgentChat } from "@/components/agent/agent-chat";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { useBranch } from "@/hooks/use-branch";

export default function BranchAgentPage() {
  const { branchId } = useBranch();
  const { data: me } = useCurrentUser();
  const canRestaurant = hasPermission(me?.user, "reports.access");
  return (
    <AgentChat
      branchId={branchId}
      scope="branch"
      title="Branch agent"
      hint="Ask about the branch you have open. The answer is read from sales, orders, the kitchen, stock, and reservations. It does not take a payment, change a price, or send a message."
      suggestions={[
        "What is happening?",
        "Sales today",
        "Open orders",
        "Late kitchen tickets",
        "Low stock",
        "Reservations today",
      ]}
      extra={
        canRestaurant ? (
          <Link href="/agent/restaurant" className="text-sm font-medium text-primary">
            Ask about every branch
          </Link>
        ) : null
      }
    />
  );
}
