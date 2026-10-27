"use client";

import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { useBranch } from "@/hooks/use-branch";
import { useCategories } from "@/hooks/use-menu";
import { ApiError, api } from "@/lib/api";

interface CreatedBranch {
  id: string;
  name: string;
  menuItems: number;
}

export function CopyMenuButton() {
  const { branchId, branches } = useBranch();
  const { data: categories, isLoading } = useCategories(branchId);
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  if (!branchId || branches.length < 2 || isLoading || (categories?.length ?? 0) > 0) {
    return null;
  }

  const onCopy = async () => {
    setPending(true);
    try {
      const result = await api.post<{ name: string; menuItems: number }>(
        `/branches/${branchId}/copy-menu`,
        {},
      );
      void queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success(
        result.menuItems > 0
          ? `${result.menuItems} dishes copied onto ${result.name}.`
          : `${result.name} already matches the original menu.`,
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not copy the menu");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onCopy}>
      {pending ? "Copying…" : "Copy menu here"}
    </Button>
  );
}

export function AddBranchDialog({ className }: { className?: string }) {
  const { setBranchId } = useBranch();
  const queryClient = useQueryClient();
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [copyMenu, setCopyMenu] = useState(true);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const created = await api.post<CreatedBranch>("/branches", {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        copyMenu,
      });
      queryClient.setQueryData<CreatedBranch[]>(["branches"], (current) => {
        const list = current ?? [];
        if (list.some((branch) => branch.id === created.id)) return list;
        return [...list, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      setBranchId(created.id);
      void queryClient.invalidateQueries({ queryKey: ["branches"] });
      void queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success(
        created.menuItems > 0
          ? `${created.name} added with ${created.menuItems} dishes.`
          : `${created.name} added.`,
      );
      setOpen(false);
      setName("");
      setAddress("");
      setPhone("");
      setCopyMenu(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add the location");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" className={className}>
            Add location
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>New location</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <p className="text-sm text-muted-foreground">
              Another branch of this restaurant. Tax settings come from the original location.
              A Dining Room floor is ready. Stock is not copied.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${fieldId}-name`}>Name</Label>
              <Input
                id={`${fieldId}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jubilee Hills"
                maxLength={80}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${fieldId}-address`}>Address</Label>
              <Input
                id={`${fieldId}-address`}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={300}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${fieldId}-phone`}>Phone</Label>
              <Input
                id={`${fieldId}-phone`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={30}
              />
            </div>
            <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2">
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Copy the menu</span>
                <span className="text-xs text-muted-foreground">
                  Dishes, prices, photos, and options from the original location.
                </span>
              </span>
              <Switch checked={copyMenu} onCheckedChange={setCopyMenu} aria-label="Copy the menu" />
            </label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? "Adding…" : "Add location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
