"use client";

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  EyeOff,
  Filter,
  GripVertical,
  LayoutGrid,
  LayoutList,
  Leaf,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AddOnsCard } from "@/components/menu/add-ons-card";
import { ChannelsCard } from "@/components/menu/channels-card";
import { KitchenSetupCard } from "@/components/menu/kitchen-setup-card";
import { MenuSetsCard } from "@/components/menu/menu-sets-card";
import { AddCategoryDialog } from "@/components/menu/add-category-dialog";
import { AddItemDialog } from "@/components/menu/add-item-dialog";
import { ComboComponentsDialog } from "@/components/menu/combo-components-dialog";
import { EditCategoryDialog } from "@/components/menu/edit-category-dialog";
import { EditItemDialog } from "@/components/menu/edit-item-dialog";
import { MenuSectionHeader } from "@/components/menu/menu-section-header";
import { MenuSectionNav } from "@/components/menu/menu-section-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ResponsiveTabs } from "@/components/ui/nav-picker";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { useBranch } from "@/hooks/use-branch";
import {
  flattenCategories,
  useCategories,
  useDeleteCategory,
  useDeleteMenuItem,
  useDuplicateMenuItem,
  useMenuItems,
  useReorderCategories,
  useReorderMenuItems,
  useUpdateMenuItem,
  type MenuCategory,
  type MenuItem,
} from "@/hooks/use-menu";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type MenuSection = "dishes" | "addons" | "channels" | "scheduling" | "kitchen";

const PAGE_SIZE = 12;

const SECTION_IDS: MenuSection[] = ["dishes", "addons", "channels", "scheduling", "kitchen"];

function printLabel(item: { name: string; price: string; barcode: string | null }) {
  const escape = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const code = item.barcode?.trim() || item.name;
  const price = formatCurrency(item.price);
  // Shelf sticker is always 50×30mm. The page canvas is full A4 so "Fit to page"
  // cannot scale a tiny page up to fill the sheet (that was the oversized print).
  // A dedicated 50×30 label printer still prints only the top-left sticker area.
  const html = `<!doctype html><html><head><title>Label — ${escape(item.name)}</title><style>
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;width:210mm;height:297mm;background:#fff;color:#111;
  font-family:system-ui,-apple-system,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.label{position:absolute;top:0;left:0;width:50mm;height:30mm;padding:2.5mm 3mm;
  display:flex;flex-direction:column;justify-content:center;gap:1mm;
  border:0.2mm solid #ccc;overflow:hidden}
h1{font-size:3.2mm;font-weight:650;margin:0;line-height:1.15;max-height:8mm;overflow:hidden}
.price{font-size:4mm;font-weight:700;margin:0;line-height:1.1}
code{display:block;font-size:2.6mm;letter-spacing:0.08em;margin:0;word-break:break-all;line-height:1.2}
@media print{.label{border:none}}
</style></head><body>
<div class="label">
<h1>${escape(item.name)}</h1>
<p class="price">${escape(price)}</p>
<code>${escape(code)}</code>
</div>
</body></html>`;

  // Same approach as receipt print (`lib/print.ts`): a real-size iframe parked
  // off-screen. A 0×0 / display:none frame lays out at 0px and clips the label;
  // `noopener` popups return null and never print.
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;top:-10000px;left:-10000px;width:794px;height:1123px;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument ?? frame.contentWindow?.document;
  if (!doc) {
    frame.remove();
    const popup = window.open("", "_blank", "width=420,height=320");
    if (!popup) {
      toast.error("Allow pop-ups to print labels, then try again.");
      return;
    }
    popup.opener = null;
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const win = frame.contentWindow;
  const cleanup = () => {
    setTimeout(() => frame.remove(), 1000);
  };
  if (!win) {
    cleanup();
    toast.error("Could not open the print preview.");
    return;
  }
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      toast.error("Could not open the print dialog.");
    } finally {
      cleanup();
    }
  }, 250);
}

function moveId(ids: string[], fromId: string, toId: string) {
  if (fromId === toId) return ids;
  const next = ids.filter((id) => id !== fromId);
  const toIndex = next.indexOf(toId);
  if (toIndex < 0) return ids;
  next.splice(toIndex, 0, fromId);
  return next;
}

function AllergenChips({ allergens }: { allergens?: string[] | null }) {
  if (!allergens?.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {allergens.slice(0, 4).map((tag) => (
        <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px] font-normal capitalize">
          {tag}
        </Badge>
      ))}
      {allergens.length > 4 ? (
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
          +{allergens.length - 4}
        </Badge>
      ) : null}
    </div>
  );
}

function ItemThumb({
  src,
  size = "md",
}: {
  src: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-20 w-20" : size === "sm" ? "h-10 w-10" : "h-14 w-14";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- uploaded asset served from the backend
      <img
        src={src}
        alt=""
        className={cn(dim, "shrink-0 rounded-xl object-cover ring-1 ring-border")}
      />
    );
  }
  return (
    <div
      className={cn(
        dim,
        "flex shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground ring-1 ring-border",
      )}
    >
      <UtensilsCrossed className={size === "lg" ? "h-7 w-7" : "h-4 w-4"} />
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={null}>
      <MenuPageInner />
    </Suspense>
  );
}

function MenuPageInner() {
  const { branchId } = useBranch();
  const { data: me } = useCurrentUser();
  const searchParams = useSearchParams();
  const canManage = hasPermission(me?.user, "menu.manage");
  const { data: categories, isLoading: categoriesLoading } = useCategories(branchId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const { data: items, isLoading: itemsLoading } = useMenuItems(branchId, selectedCategoryId);
  const { data: allItems } = useMenuItems(branchId);
  const deleteItem = useDeleteMenuItem(branchId);
  const deleteCategory = useDeleteCategory(branchId);
  const updateItem = useUpdateMenuItem(branchId);
  const duplicateItem = useDuplicateMenuItem(branchId);
  const reorderCategories = useReorderCategories(branchId);
  const reorderItems = useReorderMenuItems(branchId);
  const [comboItem, setComboItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [orderedCategories, setOrderedCategories] = useState<MenuCategory[]>([]);
  const [orderedItems, setOrderedItems] = useState<MenuItem[]>([]);
  const [dragCategoryId, setDragCategoryId] = useState<string | null>(null);
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState<"all" | "available" | "86">("all");
  const [sortBy, setSortBy] = useState<"menu" | "name" | "price">("menu");
  const [view, setView] = useState<"list" | "grid">("grid");
  const tabParam = searchParams.get("tab");
  const initialSection: MenuSection =
    tabParam && SECTION_IDS.includes(tabParam as MenuSection)
      ? (tabParam as MenuSection)
      : "dishes";
  const [section, setSection] = useState<MenuSection>(initialSection);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (tabParam && SECTION_IDS.includes(tabParam as MenuSection)) {
      setSection(tabParam as MenuSection);
    }
  }, [tabParam]);

  useEffect(() => {
    setOrderedCategories(categories ?? []);
  }, [categories]);

  useEffect(() => {
    setOrderedItems(items ?? []);
  }, [items]);

  useEffect(() => {
    setPage(1);
  }, [query, availability, sortBy, selectedCategoryId, view]);

  const selectedCategory = orderedCategories.find((c) => c.id === selectedCategoryId);
  const flatCategories = flattenCategories(orderedCategories);
  const canReorderItems = canManage && !!selectedCategoryId && sortBy === "menu" && !query && availability === "all";
  const totalItems = allItems?.length ?? 0;

  const visibleItems = useMemo(() => {
    let rows = [...orderedItems];
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.name.toLowerCase().includes(q) ||
          (item.station?.name ?? "").toLowerCase().includes(q) ||
          (item.sku ?? "").toLowerCase().includes(q),
      );
    }
    if (availability === "available") rows = rows.filter((item) => item.isActive !== false);
    if (availability === "86") rows = rows.filter((item) => item.isActive === false);
    if (sortBy === "name") rows.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "price") rows.sort((a, b) => Number(a.price) - Number(b.price));
    return rows;
  }, [orderedItems, query, availability, sortBy]);

  const pageCount = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedItems = visibleItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const onDeleteCategory = (category: MenuCategory) => {
    if (!confirm(`Delete the "${category.name}" category? This cannot be undone.`)) return;
    deleteCategory.mutate(category.id, {
      onSuccess: () => {
        toast.success(`"${category.name}" deleted`);
        if (selectedCategoryId === category.id) setSelectedCategoryId(undefined);
      },
      onError: (err) =>
        toast.error(
          err instanceof ApiError ? err.message : "Could not delete category — remove its items first",
        ),
    });
  };

  const onToggleActive = (item: MenuItem, next: boolean) => {
    const previous = orderedItems;
    setOrderedItems((rows) =>
      rows.map((row) => (row.id === item.id ? { ...row, isActive: next } : row)),
    );
    updateItem.mutate(
      { id: item.id, dto: { isActive: next } },
      {
        onSuccess: () =>
          toast.success(next ? `${item.name} available` : `${item.name} marked 86`),
        onError: (err) => {
          setOrderedItems(previous);
          toast.error(err instanceof ApiError ? err.message : "Could not update availability");
        },
      },
    );
  };

  const onDuplicate = (item: MenuItem) => {
    duplicateItem.mutate(item.id, {
      onSuccess: (created) => {
        toast.success(`Duplicated as "${created.name}"`);
        setEditingItem(created);
      },
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not duplicate item"),
    });
  };

  const onDeleteItem = (item: MenuItem) => {
    if (!confirm(`Remove "${item.name}" from the menu?`)) return;
    deleteItem.mutate(item.id, {
      onSuccess: () => toast.success(`${item.name} removed`),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not remove item"),
    });
  };

  const persistCategoryOrder = (next: MenuCategory[]) => {
    setOrderedCategories(next);
    reorderCategories.mutate(
      flattenCategories(next).map((row) => row.id),
      {
        onError: (err) => {
          setOrderedCategories(categories ?? []);
          toast.error(err instanceof ApiError ? err.message : "Could not reorder categories");
        },
      },
    );
  };

  const persistItemOrder = (next: MenuItem[]) => {
    setOrderedItems(next);
    if (!selectedCategoryId) return;
    reorderItems.mutate(
      { ids: next.map((row) => row.id), categoryId: selectedCategoryId },
      {
        onError: (err) => {
          setOrderedItems(items ?? []);
          toast.error(err instanceof ApiError ? err.message : "Could not reorder items");
        },
      },
    );
  };

  const onCategoryDrop = (targetId: string) => {
    if (!dragCategoryId || dragCategoryId === targetId) {
      setDragCategoryId(null);
      return;
    }
    const flatIds = flatCategories.map((row) => row.id);
    const nextFlatIds = moveId(flatIds, dragCategoryId, targetId);
    const byId = new Map(orderedCategories.map((row) => [row.id, row]));
    const next = nextFlatIds
      .map((id, index) => {
        const row = byId.get(id);
        return row ? { ...row, sortOrder: index } : null;
      })
      .filter(Boolean) as MenuCategory[];
    setDragCategoryId(null);
    persistCategoryOrder(next);
  };

  const onItemDrop = (targetId: string) => {
    if (!dragItemId || dragItemId === targetId || !canReorderItems) {
      setDragItemId(null);
      return;
    }
    const nextIds = moveId(
      orderedItems.map((row) => row.id),
      dragItemId,
      targetId,
    );
    const byId = new Map(orderedItems.map((row) => [row.id, row]));
    const next = nextIds
      .map((id, index) => {
        const row = byId.get(id);
        return row ? { ...row, sortOrder: index } : null;
      })
      .filter(Boolean) as MenuItem[];
    setDragItemId(null);
    persistItemOrder(next);
  };

  const itemActions = (item: MenuItem) =>
    canManage ? (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              aria-label={`Actions for ${item.name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditingItem(item)}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate(item)}>Duplicate</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setComboItem(item)}>Combo components</DropdownMenuItem>
          <DropdownMenuItem onClick={() => printLabel(item)}>Print label</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => onDeleteItem(item)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  const paginationBar =
    visibleItems.length > PAGE_SIZE ? (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          Showing {(safePage - 1) * PAGE_SIZE + 1}–
          {Math.min(safePage * PAGE_SIZE, visibleItems.length)} of {visibleItems.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <span className="min-w-16 text-center text-sm tabular-nums text-muted-foreground">
            {safePage} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={safePage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Menu</h1>
        <p className="text-sm text-muted-foreground">
          {canManage
            ? "Switch sections from the side tabs — less scrolling, same workflows"
            : "Categories, items, and pricing (view only)"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]">
        <MenuSectionNav
          canManage={canManage}
          activeSection={section}
          onSectionChange={setSection}
        />

        <div className="min-w-0">
          {section === "addons" && canManage ? <AddOnsCard branchId={branchId} /> : null}
          {section === "channels" && canManage ? <ChannelsCard branchId={branchId} /> : null}
          {section === "scheduling" && canManage ? <MenuSetsCard branchId={branchId} /> : null}
          {section === "kitchen" && canManage ? <KitchenSetupCard branchId={branchId} /> : null}

          {section === "dishes" ? (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr]">
        <Card className="flex flex-col gap-4 p-4 sm:p-5">
          <MenuSectionHeader
            title="Categories"
            description="Browse by section. Drag to reorder on desktop."
          />

          {categoriesLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 lg:hidden">
                <ResponsiveTabs
                  mobileOnly
                  label="Category"
                  value={selectedCategoryId ?? "all"}
                  onChange={(id) => setSelectedCategoryId(id === "all" ? undefined : id)}
                  items={[
                    { id: "all", label: "All items", hint: `${totalItems} items` },
                    ...flatCategories.map((c) => ({
                      id: c.id,
                      label: `${"— ".repeat(c.depth)}${c.name}`,
                      hint: `${c._count.items} items${c.showOnWebsite ? "" : " · hidden"}`,
                    })),
                  ]}
                />
                {selectedCategory && (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary/70 px-3 py-2.5">
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {selectedCategory.name}
                      </span>
                      {!selectedCategory.showOnWebsite && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <EyeOff className="h-3 w-3" /> Hidden from website
                        </span>
                      )}
                    </span>
                    {canManage && (
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 gap-1.5 px-3"
                          onClick={() => setEditingCategory(selectedCategory)}
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 gap-1.5 px-3 text-destructive"
                          onClick={() => onDeleteCategory(selectedCategory)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="hidden flex-col gap-1.5 lg:flex">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(undefined)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    !selectedCategoryId
                      ? "bg-accent text-accent-foreground ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span>All items</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "tabular-nums",
                      !selectedCategoryId && "bg-primary text-primary-foreground",
                    )}
                  >
                    {totalItems}
                  </Badge>
                </button>
                {flatCategories.map((cat) => {
                  const active = selectedCategoryId === cat.id;
                  return (
                    <div
                      key={cat.id}
                      draggable={canManage}
                      onDragStart={() => setDragCategoryId(cat.id)}
                      onDragOver={(event) => {
                        if (!canManage) return;
                        event.preventDefault();
                      }}
                      onDrop={() => onCategoryDrop(cat.id)}
                      className={cn(
                        "group flex items-center gap-1 rounded-xl py-1 pr-1 pl-1 text-sm font-medium transition-colors",
                        active
                          ? "bg-accent text-accent-foreground ring-1 ring-primary/20"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                        dragCategoryId === cat.id && "opacity-60",
                      )}
                    >
                      {canManage && (
                        <span
                          className="shrink-0 cursor-grab px-0.5 text-muted-foreground active:cursor-grabbing"
                          title="Drag to reorder"
                          aria-hidden
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="min-w-0 flex-1 truncate py-1.5 text-left"
                        style={{ paddingLeft: cat.depth ? cat.depth * 12 : undefined }}
                      >
                        {cat.name}
                      </button>
                      {!cat.showOnWebsite && (
                        <span title="Hidden from website" className="shrink-0 text-muted-foreground">
                          <EyeOff className="h-3.5 w-3.5" />
                          <span className="sr-only">Hidden from website</span>
                        </span>
                      )}
                      <Badge
                        variant="secondary"
                        className={cn(
                          "mr-0.5 tabular-nums group-hover:hidden",
                          active && "bg-primary text-primary-foreground",
                          canManage && "group-hover:hidden",
                        )}
                      >
                        {cat._count.items}
                      </Badge>
                      {canManage && (
                        <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            title="Edit category"
                            onClick={() => setEditingCategory(cat)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Delete category"
                            onClick={() => onDeleteCategory(cat)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {canManage && (
            <div className="mt-auto border-t border-border pt-3">
              <AddCategoryDialog branchId={branchId} />
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {selectedCategory ? selectedCategory.name : "All dishes"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {canReorderItems
                    ? "Drag rows to reorder in this category"
                    : `${visibleItems.length} dish${visibleItems.length === 1 ? "" : "es"}`}
                </p>
              </div>
              {canManage && <AddItemDialog branchId={branchId} categories={orderedCategories} />}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search dishes, category, station, SKU…"
                  className="pl-9"
                  aria-label="Search dishes"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" />
                  <select
                    aria-label="Availability filter"
                    className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as typeof availability)}
                  >
                    <option value="all">All availability</option>
                    <option value="available">Available</option>
                    <option value="86">86’d</option>
                  </select>
                </div>
                <select
                  aria-label="Sort dishes"
                  className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                >
                  <option value="menu">Menu order</option>
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                </select>
                <div className="flex rounded-lg border border-border p-0.5">
                  <Button
                    type="button"
                    variant={view === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    aria-label="List view"
                    onClick={() => setView("list")}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={view === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Grid view"
                    onClick={() => setView("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {itemsLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : visibleItems.length > 0 ? (
            <>
              {view === "grid" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {pagedItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm",
                        item.isActive === false && "opacity-75",
                      )}
                    >
                      <div className="absolute top-3 right-3">{itemActions(item)}</div>
                      <div className="flex items-start gap-3 pr-8">
                        <ItemThumb src={item.imageUrl} size="lg" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">{item.category.name}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 font-medium text-foreground">
                            {item.isVeg && <Leaf className="h-3.5 w-3.5 shrink-0 text-success" />}
                            <span className={cn("truncate", !item.isActive && "line-through")}>
                              {item.name}
                            </span>
                          </p>
                          <p className="mt-1 text-base font-semibold tabular-nums text-primary">
                            {formatCurrency(item.price)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.station ? item.station.name : "No station"}
                            {` · ${Number(item.taxRatePercent)}% tax`}
                          </p>
                          <AllergenChips allergens={item.allergens} />
                        </div>
                      </div>
                      {canManage && (
                        <div className="flex items-center justify-between border-t border-border pt-3">
                          <span className="text-xs text-muted-foreground">
                            {item.isActive !== false ? "Available" : "86’d"}
                          </span>
                          <Switch
                            size="sm"
                            checked={item.isActive !== false}
                            onCheckedChange={(checked) => onToggleActive(item, checked)}
                            aria-label={
                              item.isActive !== false
                                ? `86 ${item.name}`
                                : `Make ${item.name} available`
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <ul className="flex flex-col divide-y divide-border md:hidden">
                    {pagedItems.map((item) => (
                      <li key={item.id} className="flex flex-col gap-2 py-3 first:pt-0">
                        <div className="flex items-start gap-3">
                          <ItemThumb src={item.imageUrl} />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                              {item.isVeg && <Leaf className="h-3.5 w-3.5 shrink-0 text-success" />}
                              <span
                                className={cn(
                                  "min-w-0 break-words",
                                  !item.isActive && "text-muted-foreground line-through",
                                )}
                              >
                                {item.name}
                              </span>
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.category.name}
                              {item.station ? ` · ${item.station.name}` : ""}
                              {` · ${Number(item.taxRatePercent)}% tax`}
                            </p>
                            <AllergenChips allergens={item.allergens} />
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                              {formatCurrency(item.price)}
                            </p>
                            {itemActions(item)}
                          </div>
                        </div>
                        {canManage && (
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Switch
                              size="sm"
                              checked={item.isActive !== false}
                              onCheckedChange={(checked) => onToggleActive(item, checked)}
                              aria-label={
                                item.isActive !== false
                                  ? `86 ${item.name}`
                                  : `Make ${item.name} available`
                              }
                            />
                            {item.isActive !== false ? "Available" : "86"}
                          </label>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {canReorderItems ? <TableHead className="w-8" /> : null}
                          <TableHead>Dish</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Station</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Tax</TableHead>
                          {canManage ? (
                            <TableHead className="w-24 text-center">Available</TableHead>
                          ) : null}
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedItems.map((item) => (
                          <TableRow
                            key={item.id}
                            draggable={canReorderItems}
                            onDragStart={() => setDragItemId(item.id)}
                            onDragOver={(event) => {
                              if (!canReorderItems) return;
                              event.preventDefault();
                            }}
                            onDrop={() => onItemDrop(item.id)}
                            className={cn(dragItemId === item.id && "opacity-60")}
                          >
                            {canReorderItems ? (
                              <TableCell className="w-8 px-1">
                                <span
                                  className="cursor-grab text-muted-foreground active:cursor-grabbing"
                                  title="Drag to reorder"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </span>
                              </TableCell>
                            ) : null}
                            <TableCell className="font-medium text-foreground">
                              <div className="flex items-start gap-3">
                                <ItemThumb src={item.imageUrl} size="sm" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    {item.isVeg && (
                                      <Leaf className="h-3.5 w-3.5 shrink-0 text-success" />
                                    )}
                                    <span
                                      className={cn(
                                        !item.isActive && "text-muted-foreground line-through",
                                      )}
                                    >
                                      {item.name}
                                    </span>
                                  </div>
                                  <AllergenChips allergens={item.allergens} />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.category.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.station ? (
                                <Badge variant="secondary" className="font-normal">
                                  {item.station.name}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatCurrency(item.price)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {Number(item.taxRatePercent)}%
                            </TableCell>
                            {canManage ? (
                              <TableCell className="text-center">
                                <Switch
                                  size="sm"
                                  checked={item.isActive !== false}
                                  onCheckedChange={(checked) => onToggleActive(item, checked)}
                                  aria-label={
                                    item.isActive !== false
                                      ? `86 ${item.name}`
                                      : `Make ${item.name} available`
                                  }
                                />
                              </TableCell>
                            ) : null}
                            <TableCell className="text-right">{itemActions(item)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
              {paginationBar}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 py-16 text-center">
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {query || availability !== "all" ? "No dishes match these filters" : "No items yet"}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {query || availability !== "all"
                  ? "Clear search or availability filters to see more dishes."
                  : "Add a category, then add your first menu item."}
              </p>
            </div>
          )}
        </Card>
      </div>
          ) : null}
        </div>
      </div>

      <ComboComponentsDialog
        branchId={branchId}
        item={comboItem}
        allItems={allItems ?? []}
        open={!!comboItem}
        onOpenChange={(open) => !open && setComboItem(null)}
      />

      {editingCategory && (
        <EditCategoryDialog
          branchId={branchId}
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}

      {editingItem && (
        <EditItemDialog
          branchId={branchId}
          item={editingItem}
          categories={orderedCategories}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
