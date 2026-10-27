"use client";

import { ImagePlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateModifierGroup,
  useDeleteModifierGroup,
  useModifierGroups,
  useUpdateModifierImage,
  useUploadItemImage,
} from "@/hooks/use-menu";
import { ApiError } from "@/lib/api";

interface ExtraDraft {
  name: string;
  price: string;
  imageUrl: string | null;
}

function ExtraPhoto({
  name,
  imageUrl,
  onUploaded,
}: {
  name: string;
  imageUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const upload = useUploadItemImage();
  return (
    <label className="relative flex h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-dashed border-border bg-secondary">
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
  const deleteGroup = useDeleteModifierGroup(branchId);
  const updateImage = useUpdateModifierImage(branchId);
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
    createGroup.mutate(
      {
        name: name.trim() || "Add-ons",
        minSelect: 0,
        maxSelect: Math.max(1, Number(maxSelect) || 1),
        isRequired: false,
        modifiers,
      },
      {
        onSuccess: () => {
          toast.success("Add-on group saved. Attach it on each dish.");
          setName("Add-ons");
          setExtras([{ name: "", price: "", imageUrl: null }]);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save extras"),
      },
    );
  };

  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-6">
      <div>
        <h2 className="text-[18px] font-medium text-foreground">Kiosk add-ons</h2>
        <p className="text-sm text-muted-foreground">
          Same idea as a Burger King kiosk. Each extra needs a photo. The guest taps a dish,
          picks extras, then the line goes in the cart with the extra price.
        </p>
      </div>
      {groups && groups.length > 0 && (
        <ul className="flex flex-col gap-3 text-sm">
          {groups.map((group) => (
            <li key={group.id} className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <span className="font-medium">{group.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() =>
                    deleteGroup.mutate(group.id, {
                      onSuccess: () => toast.success(`${group.name} removed`),
                      onError: (err) =>
                        toast.error(err instanceof ApiError ? err.message : "Could not remove this group"),
                    })
                  }
                >
                  Remove
                </Button>
              </div>
              <div className="flex flex-wrap gap-3">
                {group.modifiers.map((row) => (
                  <div key={row.id} className="flex items-center gap-2">
                    <ExtraPhoto
                      name={row.name}
                      imageUrl={row.imageUrl ?? null}
                      onUploaded={(url) =>
                        updateImage.mutate(
                          { id: row.id, imageUrl: url },
                          {
                            onSuccess: () => toast.success(`Photo saved for ${row.name}`),
                            onError: (err) =>
                              toast.error(err instanceof ApiError ? err.message : "Could not save the photo"),
                          },
                        )
                      }
                    />
                    <span>
                      {row.name}
                      {Number(row.priceAdjustment) ? ` +${row.priceAdjustment}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onCreate} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_7rem]">
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
          <Label>Extras</Label>
          {extras.map((extra, index) => (
            <div key={index} className="flex items-center gap-2">
              <ExtraPhoto
                name={extra.name}
                imageUrl={extra.imageUrl}
                onUploaded={(url) => setExtra(index, { imageUrl: url })}
              />
              <Input
                value={extra.name}
                onChange={(e) => setExtra(index, { name: e.target.value })}
                placeholder="Extra cheese"
              />
              <Input
                className="w-24"
                type="number"
                min="0"
                value={extra.price}
                onChange={(e) => setExtra(index, { price: e.target.value })}
                placeholder="40"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setExtras((rows) => [...rows, { name: "", price: "", imageUrl: null }])}
          >
            Add another extra
          </Button>
        </div>
        <Button type="submit" className="self-start" disabled={createGroup.isPending}>
          {createGroup.isPending ? "Saving…" : "Save add-on group"}
        </Button>
      </form>
    </Card>
  );
}
