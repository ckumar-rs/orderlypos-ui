"use client";

import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MenuSectionHeader } from "@/components/menu/menu-section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateModifierGroup,
  useDeleteModifierGroup,
  useModifierGroups,
  useUpdateModifierGroup,
  useUpdateModifierImage,
  useUploadItemImage,
  type ModifierGroup,
} from "@/hooks/use-menu";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ExtraDraft {
  name: string;
  price: string;
  imageUrl: string | null;
}

function ExtraPhoto({
  name,
  imageUrl,
  onUploaded,
  size = "md",
}: {
  name: string;
  imageUrl: string | null;
  onUploaded: (url: string) => void;
  size?: "sm" | "md";
}) {
  const upload = useUploadItemImage();
  const dim = size === "sm" ? "h-12 w-12" : "h-14 w-14";
  return (
    <label
      className={cn(
        "relative flex shrink-0 cursor-pointer overflow-hidden rounded-xl border border-dashed border-border bg-secondary transition-colors hover:border-primary/40",
        dim,
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded add-on photo
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-muted-foreground">
          <ImagePlus className="h-4 w-4" />
          <span className="text-[10px]">Photo</span>
        </span>
      )}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        aria-label={`Photo for ${name || "this extra"}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          upload.mutate(file, {
            onSuccess: (res) => onUploaded(res.url),
            onError: (err) =>
              toast.error(err instanceof ApiError ? err.message : "Could not upload the photo"),
          });
        }}
      />
      {upload.isPending && (
        <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-[10px]">
          …
        </span>
      )}
    </label>
  );
}

export function AddOnsCard({ branchId }: { branchId: string | null }) {
  const { data: groups } = useModifierGroups(branchId);
  const createGroup = useCreateModifierGroup(branchId);
  const updateGroup = useUpdateModifierGroup(branchId);
  const deleteGroup = useDeleteModifierGroup(branchId);
  const updateImage = useUpdateModifierImage(branchId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("Add-ons");
  const [maxSelect, setMaxSelect] = useState("5");
  const [extras, setExtras] = useState<ExtraDraft[]>([
    { name: "Extra cheese", price: "40", imageUrl: null },
    { name: "French fries", price: "70", imageUrl: null },
    { name: "Soft drink", price: "40", imageUrl: null },
  ]);

  const setExtra = (index: number, next: Partial<ExtraDraft>) => {
    setExtras((rows) => rows.map((row, i) => (i === index ? { ...row, ...next } : row)));
  };

  const removeExtra = (index: number) => {
    setExtras((rows) => (rows.length <= 1 ? rows : rows.filter((_, i) => i !== index)));
  };

  const loadGroup = (group: ModifierGroup) => {
    setEditingId(group.id);
    setName(group.name);
    setMaxSelect(String(group.maxSelect));
    setExtras(
      group.modifiers.map((row) => ({
        name: row.name,
        price: String(row.priceAdjustment ?? 0),
        imageUrl: row.imageUrl ?? null,
      })),
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setName("Add-ons");
    setMaxSelect("5");
    setExtras([{ name: "", price: "", imageUrl: null }]);
  };

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const modifiers = extras
      .map((row, index) => ({
        name: row.name.trim(),
        priceAdjustment: Number(row.price) || 0,
        imageUrl: row.imageUrl,
        isDefault: false,
        sortOrder: index,
      }))
      .filter((row) => row.name);
    if (modifiers.length === 0) {
      toast.error("Add at least one extra");
      return;
    }
    if (modifiers.some((row) => !row.imageUrl)) {
      toast.error("Each extra needs a photo, the way a Burger King kiosk shows extras");
      return;
    }
    const dto = {
      name: name.trim() || "Add-ons",
      minSelect: 0,
      maxSelect: Math.max(1, Number(maxSelect) || 1),
      isRequired: false,
      modifiers,
    };
    if (editingId) {
      updateGroup.mutate(
        { id: editingId, dto },
        {
          onSuccess: () => {
            toast.success("Add-on group updated");
            resetForm();
          },
          onError: (err) =>
            toast.error(err instanceof ApiError ? err.message : "Could not update extras"),
        },
      );
      return;
    }
    createGroup.mutate(dto, {
      onSuccess: () => {
        toast.success("Add-on group saved. Attach it on each dish.");
        resetForm();
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save extras"),
    });
  };

  return (
    <Card className="flex flex-col gap-5 p-4 sm:p-6">
      <MenuSectionHeader
        title="Add-ons & modifiers"
        description="Build modifier groups with photos and prices, then attach them on each dish. Optional groups use min 0; max controls how many extras a guest can pick."
      />

      {groups && groups.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/30 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{group.name}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="font-normal">
                      Min {group.minSelect}
                    </Badge>
                    <Badge variant="secondary" className="font-normal">
                      Max {group.maxSelect}
                    </Badge>
                    <Badge variant="secondary" className="font-normal">
                      {group.isRequired ? "Required" : "Optional"}
                    </Badge>
                    <Badge variant="secondary" className="font-normal">
                      {group.modifiers.length} option{group.modifiers.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => loadGroup(group)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      if (!confirm(`Remove modifier group "${group.name}"?`)) return;
                      deleteGroup.mutate(group.id, {
                        onSuccess: () => toast.success(`${group.name} removed`),
                        onError: (err) =>
                          toast.error(
                            err instanceof ApiError ? err.message : "Could not remove this group",
                          ),
                      });
                    }}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {group.modifiers.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-2.5 py-2"
                  >
                    <ExtraPhoto
                      size="sm"
                      name={row.name}
                      imageUrl={row.imageUrl ?? null}
                      onUploaded={(url) =>
                        updateImage.mutate(
                          { id: row.id, imageUrl: url },
                          {
                            onSuccess: () => toast.success(`Photo saved for ${row.name}`),
                            onError: (err) =>
                              toast.error(
                                err instanceof ApiError ? err.message : "Could not save the photo",
                              ),
                          },
                        )
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(row.priceAdjustment)
                          ? `+${row.priceAdjustment}`
                          : "No extra charge"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={onCreate}
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
      >
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {editingId ? "Edit modifier group" : "New modifier group"}
          </h3>
          <p className="text-xs text-muted-foreground">
            Each option needs a name, price, and photo before you save.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addon-name">Group name</Label>
            <Input id="addon-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addon-max">Max extras</Label>
            <Input
              id="addon-max"
              type="number"
              min="1"
              value={maxSelect}
              onChange={(e) => setMaxSelect(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="hidden items-center gap-3 px-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase sm:grid sm:grid-cols-[3.5rem_1fr_7rem_2.5rem]">
            <span>Photo</span>
            <span>Option</span>
            <span>Price</span>
            <span className="sr-only">Remove</span>
          </div>
          {extras.map((extra, index) => (
            <div
              key={index}
              className="grid grid-cols-1 items-center gap-2 rounded-lg border border-border bg-secondary/20 p-2 sm:grid-cols-[3.5rem_1fr_7rem_2.5rem] sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0"
            >
              <ExtraPhoto
                name={extra.name}
                imageUrl={extra.imageUrl}
                onUploaded={(url) => setExtra(index, { imageUrl: url })}
              />
              <Input
                value={extra.name}
                onChange={(e) => setExtra(index, { name: e.target.value })}
                placeholder="Extra cheese"
                aria-label={`Option ${index + 1} name`}
              />
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  +
                </span>
                <Input
                  className="pl-7"
                  type="number"
                  min="0"
                  value={extra.price}
                  onChange={(e) => setExtra(index, { price: e.target.value })}
                  placeholder="40"
                  aria-label={`Option ${index + 1} price`}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                aria-label={`Remove option ${index + 1}`}
                disabled={extras.length <= 1}
                onClick={() => removeExtra(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start gap-1.5"
            onClick={() => setExtras((rows) => [...rows, { name: "", price: "", imageUrl: null }])}
          >
            <Plus className="h-3.5 w-3.5" />
            Add option
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
          <Button type="submit" disabled={createGroup.isPending || updateGroup.isPending}>
            {createGroup.isPending || updateGroup.isPending
              ? "Saving…"
              : editingId
                ? "Update modifier group"
                : "Save modifier group"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
