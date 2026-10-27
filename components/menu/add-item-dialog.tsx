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
  DialogTrigger,
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
import { AddonPicker } from "@/components/menu/addon-picker";
import { packedSizes, SizeRows, type SizeDraft } from "@/components/menu/size-rows";
import {
  flattenCategories,
  useCreateMenuItem,
  useStations,
  useUploadItemImage,
  type KitchenCourse,
  type MenuCategory,
} from "@/hooks/use-menu";
import { api } from "@/lib/api";
import { useSettings } from "@/hooks/use-settings";
import { ApiError } from "@/lib/api";

export function AddItemDialog({
  branchId,
  categories,
}: {
  branchId: string | null;
  categories: MenuCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [stationId, setStationId] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  const [price, setPrice] = useState("");
  const [halfPrice, setHalfPrice] = useState("");
  const [barcode, setBarcode] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [modifierGroupIds, setModifierGroupIds] = useState<string[]>([]);
  const [soldByWeight, setSoldByWeight] = useState(false);
  const [sizes, setSizes] = useState<SizeDraft[]>([]);
  const [taxRatePercent, setTaxRatePercent] = useState("5");
  const [isVeg, setIsVeg] = useState(true);
  const [isVegan, setIsVegan] = useState(false);
  const [isJain, setIsJain] = useState(false);
  const [spiceLevel, setSpiceLevel] = useState("NONE");
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [sku, setSku] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: stations } = useStations(branchId);
  const { data: courses } = useQuery({
    queryKey: ["menu", "courses", branchId],
    queryFn: () => api.get<KitchenCourse[]>(`/menu/courses?branchId=${branchId}`),
    enabled: !!branchId,
  });
  const { data: settings } = useSettings(branchId);
  const createItem = useCreateMenuItem(branchId);
  const uploadImage = useUploadItemImage();
  const nestedCategories = flattenCategories(categories);
  const priceLabel =
    settings?.branch.taxMode === "EXCLUSIVE" ? "Price (excl. tax)" : "Price (incl. tax)";

  const reset = () => {
    setName("");
    setCategoryId("");
    setStationId("");
    setCourseId("");
    setPrice("");
    setTaxRatePercent("5");
    setIsVeg(true);
    setIsVegan(false);
    setIsJain(false);
    setSpiceLevel("NONE");
    setIsGlutenFree(false);
    setSku("");
    setPrepTime("");
    setModifierGroupIds([]);
    setSizes([]);
    setImageUrl(undefined);
    setImagePreview(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    uploadImage.mutate(file, {
      onSuccess: (res) => setImageUrl(res.url),
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "Could not upload image");
        setImagePreview(undefined);
      },
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Choose a category");
      return;
    }
    createItem.mutate(
      {
        name,
        categoryId,
        stationId: stationId || undefined,
        courseId: courseId || undefined,
        price: Number(price),
        halfPrice: halfPrice.trim() === "" ? undefined : Number(halfPrice),
        taxRatePercent: Number(taxRatePercent),
        isVeg,
        isVegan,
        isJain,
        isHalal: false,
        isGlutenFree,
        sku: sku.trim() || undefined,
        prepTimeMinutes: prepTime.trim() === "" ? undefined : Number(prepTime),
        spiceLevel: spiceLevel as "NONE" | "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT",
        allergens: [],
        isActive: true,
        modifierGroupIds,
        imageUrl,
        barcode: barcode.trim() || null,
        hsnCode: hsnCode.trim() || null,
        soldByWeight,
        sizes: packedSizes(sizes),
      },
      {
        onSuccess: () => {
          toast.success(`"${name}" added to menu`);
          setOpen(false);
          reset();
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not add item"),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" disabled={categories.length === 0}>
            Add item
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New menu item</DialogTitle>
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
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
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
              <Label htmlFor="price">{priceLabel}</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tax">Tax rate %</Label>
              <Input
                id="tax"
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
            <Label htmlFor="add-half">Half portion price (optional)</Label>
            <Input
              id="add-half"
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
            <Label htmlFor="is-veg" className="cursor-pointer">
              Vegetarian
            </Label>
            <Switch id="is-veg" checked={isVeg} onCheckedChange={setIsVeg} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="is-vegan" className="cursor-pointer">Vegan</Label>
            <Switch id="is-vegan" checked={isVegan} onCheckedChange={setIsVegan} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="is-jain" className="cursor-pointer">Jain</Label>
            <Switch id="is-jain" checked={isJain} onCheckedChange={setIsJain} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="is-gluten" className="cursor-pointer">Gluten-free</Label>
            <Switch id="is-gluten" checked={isGlutenFree} onCheckedChange={setIsGlutenFree} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="spice">Spice</Label>
            <select id="spice" className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value)}>
              <option value="NONE">No spice mark</option>
              <option value="MILD">Mild</option>
              <option value="MEDIUM">Medium</option>
              <option value="HOT">Hot</option>
              <option value="EXTRA_HOT">Extra hot</option>
            </select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-sku">SKU</Label>
              <Input id="add-sku" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-prep">Prep minutes</Label>
              <Input id="add-prep" inputMode="numeric" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="add-hsn">HSN / SAC</Label>
            <Input id="add-hsn" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} placeholder="2106" maxLength={16} autoComplete="off" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-barcode">Barcode</Label>
            <Input id="add-barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scanner code" autoComplete="off" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soldByWeight} onChange={(e) => setSoldByWeight(e.target.checked)} />
            Sold by weight. The price is per kilogram.
          </label>
          <SizeRows sizes={sizes} onChange={setSizes} />
          <AddonPicker branchId={branchId} selectedIds={modifierGroupIds} onChange={setModifierGroupIds} />

          <DialogFooter>
            <Button type="submit" disabled={createItem.isPending || uploadImage.isPending}>
              {createItem.isPending ? "Adding…" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
