"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
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
import { useImportCustomers } from "@/hooks/use-customers";
import { ApiError } from "@/lib/api";

const TEMPLATE = "name,phone,email\nRiya Sharma,9876543210,riya@example.com\n";

export function ImportCustomersDialog({ branchId }: { branchId: string | null }) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: { row: number; reason: string }[];
  } | null>(null);
  const importCustomers = useImportCustomers(branchId);

  const onFile = async (file: File | null) => {
    setResult(null);
    if (!file) {
      setFileName(null);
      setCsv("");
      return;
    }
    const text = await file.text();
    setFileName(file.name);
    setCsv(text);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csv.trim()) {
      toast.error("Choose a CSV file first");
      return;
    }
    importCustomers.mutate(csv, {
      onSuccess: (res) => {
        setResult(res);
        toast.success(
          `Imported ${res.created} new · updated ${res.updated}` +
            (res.skipped ? ` · ${res.skipped} skipped` : ""),
        );
      },
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not import guests"),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setFileName(null);
          setCsv("");
          setResult(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Upload className="h-3.5 w-3.5" />
            Import CSV
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Import customers</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Columns: <code className="text-xs">name</code>,{" "}
            <code className="text-xs">phone</code>, <code className="text-xs">email</code>.
            Each row needs a phone or email. Matching phone/email updates the guest;
            new contacts are created (max 5,000 rows).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const blob = new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "customers-template.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download template
            </Button>
            <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-border px-3 text-sm hover:bg-secondary">
              Choose file
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {fileName && (
              <span className="self-center text-xs text-muted-foreground">{fileName}</span>
            )}
          </div>
          {result && (
            <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
              <p>
                Created {result.created} · updated {result.updated} · skipped {result.skipped}
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 max-h-28 overflow-y-auto text-xs text-destructive">
                  {result.errors.map((err) => (
                    <li key={`${err.row}-${err.reason}`}>
                      Row {err.row}: {err.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button type="submit" disabled={importCustomers.isPending || !csv.trim()}>
              {importCustomers.isPending ? "Importing…" : "Import"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
