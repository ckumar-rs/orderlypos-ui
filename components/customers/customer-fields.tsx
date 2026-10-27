"use client";

import { RecordFields } from "@/components/fields/record-fields";

export function CustomerFields({
  branchId,
  customerId,
}: {
  branchId: string | null;
  customerId: string;
}) {
  return <RecordFields branchId={branchId} entity="CUSTOMER" entityId={customerId} />;
}
