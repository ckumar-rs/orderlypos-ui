"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";

interface BrandRow {
  id: string;
  name: string;
  branches: Array<{ id: string; name: string }>;
}

export default function BrandsPage() {
  const { branches } = useBranch();
  const qc = useQueryClient();
  const brands = useQuery({
    queryKey: ["brands"],
    queryFn: () => api.get<BrandRow[]>("/service/brands"),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [brandId, setBrandId] = useState("");

  const reset = () => {
    setEditingId(null);
    setName("");
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return toast.error("Enter a brand name");
    const req = editingId
      ? api.patch(`/service/brands/${editingId}`, { name: trimmed })
      : api.post("/service/brands", { name: trimmed });
    req
      .then(() => {
        toast.success(editingId ? "Brand updated" : "Brand created");
        reset();
        qc.invalidateQueries({ queryKey: ["brands"] });
      })
      .catch((error) =>
        toast.error(error instanceof ApiError ? error.message : editingId ? "Could not update" : "Could not create"),
      );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Brands</h1>
        <p className="text-sm text-muted-foreground">A brand groups branches. Menus stay on the branch.</p>
      </div>
      <Card className="flex gap-2 p-4">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand name" />
        <Button type="button" onClick={submit}>
          {editingId ? "Save" : "Create"}
        </Button>
        {editingId && (
          <Button type="button" variant="outline" onClick={reset}>
            Cancel
          </Button>
        )}
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {(brands.data ?? []).map((brand) => (
          <Card key={brand.id} className="flex flex-col gap-2 p-4">
            <p className="font-medium">{brand.name}</p>
            <p className="text-sm text-muted-foreground">{brand.branches.map((branch) => branch.name).join(", ") || "No branches"}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(brand.id);
                  setName(brand.name);
                }}
              >
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!confirm(`Delete ${brand.name}?`)) return;
                  api
                    .delete(`/service/brands/${brand.id}`)
                    .then(() => {
                      if (editingId === brand.id) reset();
                      toast.success("Brand deleted");
                      qc.invalidateQueries({ queryKey: ["brands"] });
                    })
                    .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not delete"));
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Card className="grid gap-2 p-4 md:grid-cols-3">
        <select className="h-10 rounded-md border border-input bg-background px-2" value={branchId} onChange={(e) => setBranchId(e.target.value)} aria-label="Branch">
          <option value="">Branch</option>
          {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </select>
        <select className="h-10 rounded-md border border-input bg-background px-2" value={brandId} onChange={(e) => setBrandId(e.target.value)} aria-label="Brand">
          <option value="">No brand</option>
          {(brands.data ?? []).map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </select>
        <Button type="button" disabled={!branchId} onClick={() => api.post("/service/brands/assign", { branchId, brandId: brandId || null }).then(() => { toast.success("Branch assigned"); qc.invalidateQueries({ queryKey: ["brands"] }); }).catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not assign"))}>Assign</Button>
      </Card>
    </div>
  );
}
