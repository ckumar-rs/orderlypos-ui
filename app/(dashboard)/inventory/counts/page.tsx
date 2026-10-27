"use client";

import { NewStockCountDialog } from "@/components/inventory/new-stock-count-dialog";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/hooks/use-branch";
import { usePostStockCount, useStockCount, useStockCounts } from "@/hooks/use-inventory";
import { ApiError } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";

export default function StockCountsPage() {
  const { branchId } = useBranch();
  const { data: counts, isLoading } = useStockCounts(branchId);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: detail } = useStockCount(branchId, openId);
  const post = usePostStockCount(branchId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Physical audit vs what the recipes already deducted
          </p>
        </div>
        <NewStockCountDialog branchId={branchId} />
      </div>

      <InventoryTabs />

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : counts && counts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>Counted by</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {counts.map((count) => (
                <TableRow key={count.id}>
                  <TableCell className="font-medium">{count.countNumber}</TableCell>
                  <TableCell>
                    <Badge variant={count.status === "POSTED" ? "default" : "outline"}>
                      {count.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{count._count?.lines ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{count.countedBy.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(count.countedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setOpenId(count.id)}>
                      Lines
                    </Button>
                    {count.status === "DRAFT" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          post.mutate(count.id, {
                            onSuccess: () => toast.success(`${count.countNumber} posted`),
                            onError: (err) =>
                              toast.error(
                                err instanceof ApiError ? err.message : "Could not post count",
                              ),
                          })
                        }
                      >
                        Post
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No physical counts yet</p>
            <p className="text-sm text-muted-foreground">
              Count the shelves. Variance after you post is unexplained loss (theft, waste not
              logged, or yield).
            </p>
          </div>
        )}
      </Card>

      {detail?.lines && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3 text-sm font-medium">
            {detail.countNumber}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead className="text-right">System</TableHead>
                <TableHead className="text-right">Counted</TableHead>
                <TableHead className="text-right">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.ingredient.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.expectedQty} {line.ingredient.unit}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.countedQty} {line.ingredient.unit}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${line.varianceQty < 0 ? "text-destructive" : ""}`}
                  >
                    {line.varianceQty}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
