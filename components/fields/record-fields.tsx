"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, api } from "@/lib/api";

export type FieldEntity =
  | "CUSTOMER"
  | "ORDER"
  | "MENU_ITEM"
  | "RESERVATION"
  | "SUPPLIER"
  | "EMPLOYEE"
  | "TABLE";

interface FieldRow {
  id: string;
  label: string;
  value: string;
}

export function RecordFields({
  branchId,
  entity,
  entityId,
  title = "Extra fields",
}: {
  branchId: string | null;
  entity: FieldEntity;
  entityId: string;
  title?: string;
}) {
  const queryClient = useQueryClient();
  const fields = useQuery({
    queryKey: ["custom-fields", branchId, entity, entityId],
    queryFn: () =>
      api.get<FieldRow[]>(
        `/platform/fields?branchId=${branchId}&entity=${entity}&entityId=${entityId}`,
      ),
    enabled: !!branchId && !!entityId,
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  if (!fields.data?.length) return null;
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-[18px] font-medium">{title}</h2>
      {fields.data.map((field) => (
        <form
          key={field.id}
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const value = drafts[field.id] ?? field.value;
            api
              .put(`/platform/fields/${field.id}?branchId=${branchId}`, { entityId, value })
              .then(() => {
                toast.success(`${field.label} saved`);
                void queryClient.invalidateQueries({
                  queryKey: ["custom-fields", branchId, entity, entityId],
                });
              })
              .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save"));
          }}
        >
          <label className="flex flex-1 flex-col gap-1 text-sm">
            {field.label}
            <Input
              value={drafts[field.id] ?? field.value}
              onChange={(event) => setDrafts((current) => ({ ...current, [field.id]: event.target.value }))}
            />
          </label>
          <Button type="submit">Save</Button>
        </form>
      ))}
    </Card>
  );
}
