"use client";

import { ImagePlus, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  flattenCategories,
  useMenuRuleActions,
  useSalesChannels,
  useStations,
  useUpdateMenuItem,
  useUploadItemImage,
  type KitchenCourse,
  type MenuCategory,
  type MenuItem,
} from "@/hooks/use-menu";
import { ApiError, api } from "@/lib/api";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { AddonPicker } from "@/components/menu/addon-picker";
import { packedSizes, SizeRows, type SizeDraft } from "@/components/menu/size-rows";
import { StockTrackingSection } from "@/components/menu/stock-tracking-section";
import { useSettings } from "@/hooks/use-settings";
import { RecordFields } from "@/components/fields/record-fields";

// Mounted only while a specific item is being edited (see MenuPage), keyed
// by item.id — same pattern as EditRoleDialog/EditCategoryDialog.
export function EditItemDialog({
  branchId,
  item,
  categories,
  onClose,
}: {
  branchId: string | null;
  item: MenuItem;
  categories: MenuCategory[];
  onClose: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [stationId, setStationId] = useState(item.stationId ?? "");
  const [courseId, setCourseId] = useState(item.courseId ?? "");
  const [price, setPrice] = useState(item.price);
  const [halfPrice, setHalfPrice] = useState(item.halfPrice ?? "");
  const [taxRatePercent, setTaxRatePercent] = useState(item.taxRatePercent);
  const [isVeg, setIsVeg] = useState(item.isVeg);
  const [isVegan, setIsVegan] = useState(Boolean(item.isVegan));
  const [isJain, setIsJain] = useState(Boolean(item.isJain));
  const [spiceLevel, setSpiceLevel] = useState(item.spiceLevel ?? "NONE");
  const [isGlutenFree, setIsGlutenFree] = useState(Boolean(item.isGlutenFree));
  const [sku, setSku] = useState(item.sku ?? "");
  const [prepTime, setPrepTime] = useState(item.prepTimeMinutes == null ? "" : String(item.prepTimeMinutes));
  const [barcode, setBarcode] = useState(item.barcode ?? "");
  const [hsnCode, setHsnCode] = useState(item.hsnCode ?? "");
  const [soldByWeight, setSoldByWeight] = useState(item.soldByWeight);
  const [modifierGroupIds, setModifierGroupIds] = useState(
    item.modifierGroups.map((row) => row.modifierGroup.id),
  );
  const [sizes, setSizes] = useState<SizeDraft[]>(
    (item.sizes ?? []).map((row) => ({ name: row.name, price: String(row.price) })),
  );
  const [channelPrices, setChannelPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries((item.channelPrices ?? []).map((row) => [row.channelId, String(row.price)])),
  );
  const [imageUrl, setImageUrl] = useState<string | undefined>(item.imageUrl ?? undefined);
  const [imagePreview, setImagePreview] = useState<string | undefined>(item.imageUrl ?? undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: stations } = useStations(branchId);
  const { data: courses } = useQuery({
    queryKey: ["menu", "courses", branchId],
    queryFn: () => api.get<KitchenCourse[]>(`/menu/courses?branchId=${branchId}`),
    enabled: !!branchId,
  });
  const { data: channels } = useSalesChannels(branchId);
  const { data: settings } = useSettings(branchId);
  const { data: me } = useCurrentUser();
  const updateItem = useUpdateMenuItem(branchId);
  const uploadImage = useUploadItemImage();
  const { setItemChannelPrices } = useMenuRuleActions(branchId);
  const nestedCategories = flattenCategories(categories);
  const priceLabel =
    settings?.branch.taxMode === "EXCLUSIVE" ? "Price (excl. tax)" : "Price (incl. tax)";

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    uploadImage.mutate(file, {
      onSuccess: (res) => setImageUrl(res.url),
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "Could not upload image");
        setImagePreview(item.imageUrl ?? undefined);
      },
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Choose a category");
      return;
    }
    updateItem.mutate(
      {
        id: item.id,
        dto: {
          name,
          categoryId,
          stationId: stationId || undefined,
          courseId: courseId || null,
          price: Number(price),
          halfPrice: halfPrice.trim() === "" ? null : Number(halfPrice),
          taxRatePercent: Number(taxRatePercent),
          isVeg,
          isVegan,
          isJain,
          spiceLevel: spiceLevel as "NONE" | "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT",
          isGlutenFree,
          sku: sku.trim() || undefined,
          prepTimeMinutes: prepTime.trim() === "" ? undefined : Number(prepTime),
          imageUrl,
          barcode: barcode.trim() || null,
          hsnCode: hsnCode.trim() || null,
          soldByWeight,
          sizes: packedSizes(sizes),
          modifierGroupIds,
        },
      },
      {
        onSuccess: () => {
          if (!(channels ?? []).length) {
            toast.success(`"${name}" updated`);
            onClose();
            return;
          }
          const prices = (channels ?? [])
            .map((channel) => ({
              channelId: channel.id,
              price: Number(channelPrices[channel.id]),
            }))
            .filter((row) => Number.isFinite(row.price) && row.price > 0);
          setItemChannelPrices.mutate(
            { id: item.id, prices },
            {
              onSuccess: () => {
                toast.success(`"${name}" updated`);
                onClose();
              },
              onError: (err) =>
                toast.error(err instanceof ApiError ? err.message : "Saved dish, but channel prices failed"),
            },
          );
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update item"),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit menu item</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label>Photo</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={onFileChange}
            />
            {imagePreview ? (
              <div className="relative h-28 w-28 overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob/uploaded preview, not a Next-optimizable remote asset */}
                <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(undefined);
                    setImagePreview(undefined);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground"
                  aria-label="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {uploadImage.isPending && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-xs">
                    Uploading…
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs">Add photo</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="item-edit-name">Name</Label>
            <Input
              id="item-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Margherita Pizza"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {nestedCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {`${"– ".repeat(c.depth)}${c.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-price">{priceLabel}</Label>
              <Input
                id="edit-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-tax">Tax rate %</Label>
              <Input
                id="edit-tax"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-half">Half portion price (optional)</Label>
            <Input
              id="edit-half"
              type="number"
              min="0"
              step="0.01"
              value={halfPrice}
              onChange={(e) => setHalfPrice(e.target.value)}
              placeholder="Leave empty if there is no half/full choice"
            />
            <p className="text-xs text-muted-foreground">
              When set, the POS asks Half / Full / Custom. The price above is the Full portion.
            </p>
          </div>

          {(channels ?? []).length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Channel prices</Label>
              <p className="text-xs text-muted-foreground">
                Leave blank to use the channel markup on the base price.
              </p>
              {(channels ?? []).map((channel) => (
                <div key={channel.id} className="grid grid-cols-[1fr_7rem] items-center gap-2">
                  <span className="text-sm">
                    {channel.name}
                    {Number(channel.markupPercent)
                      ? ` · +${Number(channel.markupPercent)}%`
                      : ""}
                  </span>
                  <Input
                    inputMode="decimal"
                    placeholder="Override"
                    value={channelPrices[channel.id] ?? ""}
                    onChange={(e) =>
                      setChannelPrices((prev) => ({ ...prev, [channel.id]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>Kitchen station</Label>
            <Select value={stationId} onValueChange={(v) => setStationId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {stations?.filter((s) => s.role !== "EXPO").map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Kitchen course</Label>
            <Select value={courseId} onValueChange={(v) => setCourseId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {(courses ?? []).map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="edit-is-veg" className="cursor-pointer">
              Vegetarian
            </Label>
            <Switch id="edit-is-veg" checked={isVeg} onCheckedChange={setIsVeg} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="edit-is-vegan" className="cursor-pointer">Vegan</Label>
            <Switch id="edit-is-vegan" checked={isVegan} onCheckedChange={setIsVegan} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="edit-is-jain" className="cursor-pointer">Jain</Label>
            <Switch id="edit-is-jain" checked={isJain} onCheckedChange={setIsJain} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="edit-is-gluten" className="cursor-pointer">Gluten-free</Label>
            <Switch id="edit-is-gluten" checked={isGlutenFree} onCheckedChange={setIsGlutenFree} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-spice">Spice</Label>
            <select id="edit-spice" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value)}>
              <option value="NONE">No spice mark</option>
              <option value="MILD">Mild</option>
              <option value="MEDIUM">Medium</option>
              <option value="HOT">Hot</option>
              <option value="EXTRA_HOT">Extra hot</option>
            </select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-sku">SKU</Label>
              <Input id="edit-sku" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-prep">Prep minutes</Label>
              <Input id="edit-prep" inputMode="numeric" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-hsn">HSN / SAC</Label>
            <Input id="edit-hsn" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} placeholder="2106" maxLength={16} autoComplete="off" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-barcode">Barcode</Label>
            <Input id="edit-barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scanner code" autoComplete="off" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soldByWeight} onChange={(e) => setSoldByWeight(e.target.checked)} />
            Sold by weight. The price is per kilogram.
          </label>
          <SizeRows sizes={sizes} onChange={setSizes} />
          <AddonPicker branchId={branchId} selectedIds={modifierGroupIds} onChange={setModifierGroupIds} />

          <DialogFooter>
            <Button type="submit" disabled={updateItem.isPending || uploadImage.isPending || setItemChannelPrices.isPending}>
              {updateItem.isPending || setItemChannelPrices.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
        <RecordFields branchId={branchId} entity="MENU_ITEM" entityId={item.id} />
        {hasPermission(me?.user, "inventory.manage") && (
          <StockTrackingSection branchId={branchId} itemId={item.id} isCombo={item.isCombo} />
        )}
      </DialogContent>
    </Dialog>
  );
}
