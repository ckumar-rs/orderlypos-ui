"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";
import { TableSectionNav } from "@/components/tables/table-section-nav";

const OPTIONS = ["INDOOR", "OUTDOOR", "COVERED"] as const;

export default function FloorAreasPage() {
  const { branchId } = useBranch();
  const qc = useQueryClient();
  const floors = useQuery({
    queryKey: ["floor-seating", branchId],
    enabled: Boolean(branchId),
    queryFn: () => api.get<Array<{ id: string; name: string; seating: string }>>(`/service/floors?branchId=${branchId}`),
  });
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <TableSectionNav />
      <div>
        <h1 className="text-2xl font-semibold">Indoor and outdoor areas</h1>
        <p className="text-sm text-muted-foreground">Each floor is one seating type. Tables stay on that floor.</p>
      </div>
      <div className="flex flex-col gap-3">
        {(floors.data ?? []).map((floor) => (
          <FloorRow
            key={floor.id}
            name={floor.name}
            seating={floor.seating}
            onChange={(seating) =>
              api.patch(`/service/floors/${floor.id}?branchId=${branchId}`, { seating })
                .then(() => { toast.success(`${floor.name} is ${seating.toLowerCase()}`); qc.invalidateQueries({ queryKey: ["floor-seating", branchId] }); })
                .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save"))
            }
          />
        ))}
      </div>
    </div>
  );
}

function FloorRow({ name, seating, onChange }: { name: string; seating: string; onChange: (value: string) => void }) {
  const [value, setValue] = useState(seating);
  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <p className="font-medium">{name}</p>
      <div className="flex gap-2">
        <select className="h-10 rounded-md border border-input bg-background px-2" value={value} onChange={(e) => setValue(e.target.value)} aria-label={`${name} seating`}>
          {OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <Button type="button" variant="outline" onClick={() => onChange(value)}>Save</Button>
      </div>
    </Card>
  );
}
