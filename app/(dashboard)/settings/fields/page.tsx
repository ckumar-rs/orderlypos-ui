"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";
import { cn } from "@/lib/utils";

const ENTITIES = [
  ["CUSTOMER", "Customers"],
  ["ORDER", "Orders"],
  ["MENU_ITEM", "Menu items"],
  ["RESERVATION", "Reservations"],
  ["SUPPLIER", "Suppliers"],
  ["EMPLOYEE", "Employees"],
  ["TABLE", "Tables"],
] as const;

type Entity = (typeof ENTITIES)[number][0];

interface Field {
  id: string;
  key: string;
  label: string;
}

export default function FieldsPage() {
  const { branchId } = useBranch();
  const queryClient = useQueryClient();
  const [entity, setEntity] = useState<Entity>("CUSTOMER");
  const fields = useQuery({
    queryKey: ["field-defs", branchId, entity],
    queryFn: () => api.get<Field[]>(`/platform/fields?branchId=${branchId}&entity=${entity}`),
    enabled: !!branchId,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [pending, setPending] = useState(false);
  const current = ENTITIES.find((row) => row[0] === entity)?.[1] ?? "Records";

  const reset = () => {
    setEditingId(null);
    setLabel("");
    setKey("");
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["field-defs", branchId, entity] });

  const submit = () => {
    if (!branchId || !label.trim() || !key.trim()) return;
    setPending(true);
    const req = editingId
      ? api.patch(`/platform/fields/${editingId}?branchId=${branchId}`, { label, key })
      : api.post(`/platform/fields?branchId=${branchId}`, { entity, key, label });
    req
      .then(() => {
        toast.success(editingId ? "Field updated" : `Field added for ${current.toLowerCase()}`);
        reset();
        return invalidate();
      })
      .catch((error) =>
        toast.error(error instanceof ApiError ? error.message : editingId ? "Could not update" : "Could not add"),
      )
      .finally(() => setPending(false));
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Extra fields</h1>
        <p className="text-sm text-muted-foreground">
          A field defined here is filled in on that record: the customer, the order, the menu item, the reservation, the supplier, the employee, or the table.
        </p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Record type">
        {ENTITIES.map(([value, name]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setEntity(value);
              reset();
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              entity === value ? "border-primary bg-primary text-primary-foreground" : "border-border",
            )}
          >
            {name}
          </button>
        ))}
      </div>
      <Card className="flex flex-wrap items-end gap-2 p-4">
        <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Label" aria-label="Label" />
        <Input value={key} onChange={(event) => setKey(event.target.value)} placeholder="key" aria-label="Key" />
        <Button type="button" disabled={!branchId || !label.trim() || !key.trim() || pending} onClick={submit}>
          {editingId ? "Save" : "Create"}
        </Button>
        {editingId && (
          <Button type="button" variant="outline" onClick={reset}>
            Cancel
          </Button>
        )}
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {(fields.data ?? []).map((field) => (
          <Card key={field.id} className="flex items-start justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{field.label}</p>
              <p className="text-sm text-muted-foreground">{field.key}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(field.id);
                  setLabel(field.label);
                  setKey(field.key);
                }}
              >
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!confirm(`Delete field "${field.label}"?`)) return;
                  api
                    .delete(`/platform/fields/${field.id}?branchId=${branchId}`)
                    .then(() => {
                      if (editingId === field.id) reset();
                      toast.success("Field deleted");
                      return invalidate();
                    })
                    .catch((error) =>
                      toast.error(error instanceof ApiError ? error.message : "Could not delete"),
                    );
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
        {fields.data && fields.data.length === 0 && (
          <p className="text-sm text-muted-foreground">No fields for {current.toLowerCase()} yet.</p>
        )}
      </div>
    </div>
  );
}
