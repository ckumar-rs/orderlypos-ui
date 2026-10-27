"use client";

import { Pencil, Trash2, Users } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useDeleteTable,
  useUpdateTableLayout,
  type RestaurantTable,
} from "@/hooks/use-tables";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TableShapeIcon } from "./table-shape-icon";

function snap(value: number, grid: number) {
  if (!grid) return Math.max(0, value);
  return Math.max(0, Math.round(value / grid) * grid);
}

export function EditableTableTile({
  table,
  branchId,
  gridSize = 20,
  onEdit,
}: {
  table: RestaurantTable;
  branchId: string | null;
  gridSize?: number;
  onEdit: () => void;
}) {
  const updateLayout = useUpdateTableLayout(branchId);
  const deleteTable = useDeleteTable(branchId);
  const [dragPos, setDragPos] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragStart = useRef<{
    mode: "move" | "resize";
    pointerX: number;
    pointerY: number;
    posX: number;
    posY: number;
    width: number;
    height: number;
  } | null>(null);

  const posX = dragPos?.x ?? table.posX;
  const posY = dragPos?.y ?? table.posY;
  const width = dragPos?.w ?? table.width;
  const height = dragPos?.h ?? table.height;

  const beginDrag = (e: React.PointerEvent, mode: "move" | "resize") => {
    if (mode === "move" && (e.target as HTMLElement).closest("button")) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = {
      mode,
      pointerX: e.clientX,
      pointerY: e.clientY,
      posX: table.posX,
      posY: table.posY,
      width: table.width,
      height: table.height,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const { mode, pointerX, pointerY, posX: startX, posY: startY, width: startW, height: startH } =
      dragStart.current;
    const dx = e.clientX - pointerX;
    const dy = e.clientY - pointerY;
    if (mode === "resize") {
      setDragPos({
        x: startX,
        y: startY,
        w: snap(Math.max(gridSize || 40, startW + dx), gridSize),
        h: snap(Math.max(gridSize || 40, startH + dy), gridSize),
      });
      return;
    }
    setDragPos({
      x: snap(startX + dx, gridSize),
      y: snap(startY + dy, gridSize),
      w: startW,
      h: startH,
    });
  };

  const onPointerUp = () => {
    if (!dragStart.current || !dragPos) {
      dragStart.current = null;
      return;
    }
    dragStart.current = null;
    updateLayout.mutate(
      [
        {
          id: table.id,
          posX: dragPos.x,
          posY: dragPos.y,
          width: dragPos.w,
          height: dragPos.h,
          rotation: table.rotation,
        },
      ],
      { onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save position") },
    );
    setDragPos(null);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete ${table.name ?? `Table ${table.number}`}?`)) return;
    deleteTable.mutate(table.id, {
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete table"),
    });
  };

  return (
    <div
      onPointerDown={(e) => beginDrag(e, "move")}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={cn(
        "absolute flex cursor-grab touch-none flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 text-xs font-medium text-foreground shadow-sm active:cursor-grabbing",
      )}
      style={{ left: posX, top: posY, width, height }}
    >
      <TableShapeIcon shape={table.shape} capacity={table.capacity} className="h-6 w-6" />
      <span className="text-sm font-semibold">{table.name ?? `T${table.number}`}</span>
      <span className="flex items-center gap-1 text-[11px] opacity-80">
        <Users className="h-3 w-3" />
        {table.capacity}
      </span>
      <div className="absolute -top-3 right-1 flex gap-1">
        <Button
          variant="secondary"
          size="icon"
          className="h-6 w-6 shadow"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-6 w-6 text-destructive shadow"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <button
        type="button"
        aria-label="Resize table"
        className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-se-resize rounded-sm border border-primary bg-background"
        onPointerDown={(e) => beginDrag(e, "resize")}
      />
    </div>
  );
}
