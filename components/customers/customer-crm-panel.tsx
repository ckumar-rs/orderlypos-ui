"use client";

import { Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddCustomerNote,
  useCompleteFollowUp,
  useCreateFollowUp,
  useCustomerFollowUps,
  useCustomerTimeline,
  useReopenFollowUp,
} from "@/hooks/use-customers";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const err = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");

function kindLabel(kind: string) {
  switch (kind) {
    case "NOTE":
      return "Note";
    case "FOLLOW_UP":
      return "Follow-up";
    case "FOLLOW_UP_DONE":
      return "Done";
    case "ORDER":
      return "Order";
    case "MESSAGE":
      return "Message";
    default:
      return kind;
  }
}

export function CustomerCrmPanel({
  branchId,
  customerId,
}: {
  branchId: string | null;
  customerId: string;
}) {
  const { data: timeline, isLoading: timelineLoading } = useCustomerTimeline(branchId, customerId);
  const { data: followUps, isLoading: followUpsLoading } = useCustomerFollowUps(
    branchId,
    customerId,
  );
  const addNote = useAddCustomerNote(branchId, customerId);
  const createFollowUp = useCreateFollowUp(branchId, customerId);
  const completeFollowUp = useCompleteFollowUp(branchId, customerId);
  const reopenFollowUp = useReopenFollowUp(branchId, customerId);

  const [noteBody, setNoteBody] = useState("");
  const [followTitle, setFollowTitle] = useState("");
  const [followBody, setFollowBody] = useState("");
  const [followDue, setFollowDue] = useState("");

  const openFollowUps = (followUps ?? []).filter((f) => !f.doneAt);
  const doneFollowUps = (followUps ?? []).filter((f) => f.doneAt);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-[18px] font-medium text-foreground">Follow-ups</h2>
          <p className="text-xs text-muted-foreground">
            Call-backs, VIP visits, birthday reminders — stays on this guest.
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <Input
            placeholder="Follow-up title"
            value={followTitle}
            onChange={(e) => setFollowTitle(e.target.value)}
          />
          <Input
            placeholder="Details (optional)"
            value={followBody}
            onChange={(e) => setFollowBody(e.target.value)}
          />
          <Input
            type="date"
            aria-label="Due date"
            value={followDue}
            onChange={(e) => setFollowDue(e.target.value)}
          />
          <Button
            size="sm"
            className="self-start"
            disabled={createFollowUp.isPending || !followTitle.trim()}
            onClick={() =>
              createFollowUp.mutate(
                {
                  title: followTitle.trim(),
                  body: followBody.trim() || null,
                  dueAt: followDue ? new Date(`${followDue}T12:00:00`) : null,
                },
                {
                  onSuccess: () => {
                    toast.success("Follow-up saved");
                    setFollowTitle("");
                    setFollowBody("");
                    setFollowDue("");
                  },
                  onError: (e) => toast.error(err(e)),
                },
              )
            }
          >
            Add follow-up
          </Button>
        </div>

        {followUpsLoading ? (
          <Skeleton className="h-24" />
        ) : openFollowUps.length === 0 && doneFollowUps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No follow-ups yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {openFollowUps.map((f) => {
              const overdue =
                f.dueAt && !f.doneAt && new Date(f.dueAt).getTime() < Date.now();
              return (
                <div
                  key={f.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{f.title}</p>
                    {f.body && (
                      <p className="text-xs text-muted-foreground">{f.body}</p>
                    )}
                    <p
                      className={cn(
                        "text-xs",
                        overdue ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {f.dueAt
                        ? `Due ${new Date(f.dueAt).toLocaleDateString()}`
                        : "No due date"}
                      {f.createdBy?.name ? ` · ${f.createdBy.name}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={completeFollowUp.isPending}
                    onClick={() =>
                      completeFollowUp.mutate(f.id, {
                        onSuccess: () => toast.success("Marked done"),
                        onError: (e) => toast.error(err(e)),
                      })
                    }
                  >
                    <Check className="h-3.5 w-3.5" />
                    Done
                  </Button>
                </div>
              );
            })}
            {doneFollowUps.slice(0, 5).map((f) => (
              <div
                key={f.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-dashed border-border px-3 py-2 opacity-80"
              >
                <div>
                  <p className="text-sm text-muted-foreground line-through">{f.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Done
                    {f.completedBy?.name ? ` by ${f.completedBy.name}` : ""}
                    {f.doneAt ? ` · ${new Date(f.doneAt).toLocaleString()}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={reopenFollowUp.isPending}
                  onClick={() =>
                    reopenFollowUp.mutate(f.id, {
                      onSuccess: () => toast.success("Reopened"),
                      onError: (e) => toast.error(err(e)),
                    })
                  }
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reopen
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-[18px] font-medium text-foreground">Timeline</h2>
          <p className="text-xs text-muted-foreground">
            Notes, follow-ups, paid visits, and campaign messages in one place.
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <textarea
            aria-label="New note"
            placeholder="Add a staff note…"
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            rows={3}
            className="min-h-16 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <Button
            size="sm"
            className="self-start"
            disabled={addNote.isPending || !noteBody.trim()}
            onClick={() =>
              addNote.mutate(
                { body: noteBody.trim() },
                {
                  onSuccess: () => {
                    toast.success("Note added");
                    setNoteBody("");
                  },
                  onError: (e) => toast.error(err(e)),
                },
              )
            }
          >
            Add note
          </Button>
        </div>

        {timelineLoading ? (
          <Skeleton className="h-40" />
        ) : !timeline?.events.length ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ol className="relative flex flex-col gap-0 border-l border-border pl-4">
            {timeline.events.map((ev) => (
              <li key={ev.id} className="relative pb-4 last:pb-0">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border border-border bg-background" />
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {kindLabel(ev.kind)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(ev.at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">{ev.title}</p>
                {ev.detail && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ev.detail}</p>
                )}
                {ev.kind === "ORDER" && ev.meta?.totalAmount != null && (
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatCurrency(String(ev.meta.totalAmount))}
                  </p>
                )}
                {typeof ev.meta?.createdBy === "string" && ev.meta.createdBy && (
                  <p className="text-xs text-muted-foreground">by {ev.meta.createdBy}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
