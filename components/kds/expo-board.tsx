"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAssembleExpo, useFireCourse, useKdsExpo, usePassExpo, type KotTicket } from "@/hooks/use-kds";
import { ApiError } from "@/lib/api";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";

function courseGroups(tickets: KotTicket[]) {
  const groups = new Map<string, { id: string | null; name: string; tickets: KotTicket[] }>();
  for (const ticket of tickets) {
    const id = ticket.course?.id ?? "";
    const group = groups.get(id) ?? { id: id || null, name: ticket.course?.name ?? "No course", tickets: [] };
    group.tickets.push(ticket);
    groups.set(id, group);
  }
  return [...groups.values()];
}

export function ExpoBoard({ branchId }: { branchId: string | null }) {
  const board = useKdsExpo(branchId, true);
  const assemble = useAssembleExpo(branchId);
  const fire = useFireCourse(branchId);
  const pass = usePassExpo(branchId);

  if (board.isError) {
    return (
      <QueryError
        error={board.error}
        what="the expo board"
        onRetry={() => void board.refetch()}
        retrying={board.isFetching}
      />
    );
  }

  const fail = (err: unknown, fallback: string) =>
    toast.error(err instanceof ApiError ? err.message : fallback);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {board.isLoading &&
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
      {(board.data ?? []).map((order) => (
        <Card key={order.orderId} className="flex flex-col gap-3 p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">#{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">
              {order.table ? `Table ${order.table.number}` : order.type}
              {order.guestName ? ` · ${order.guestName}` : ""}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {courseGroups(order.kots).map((course) => {
              const held = course.tickets.filter((ticket) => ticket.held);
              return (
                <div key={course.id ?? "none"} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{course.name}</p>
                    {course.id && held.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={fire.isPending}
                        onClick={() =>
                          fire.mutate(
                            { orderId: order.orderId, courseId: course.id! },
                            {
                              onSuccess: () => toast.success(`${course.name} fired`),
                              onError: (err) => fail(err, "Could not fire that course"),
                            },
                          )
                        }
                      >
                        Fire course
                      </Button>
                    )}
                  </div>
                  {course.tickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                      <p className="font-medium text-foreground">
                        {ticket.station?.name ?? "Unassigned"}
                        {ticket.held ? " · held" : ticket.firedAt ? " · fired" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{ticket.status.toLowerCase()}</p>
                      {ticket.items.map((item) => (
                        <p key={item.id} className="text-xs text-muted-foreground">
                          {item.orderItem.quantity}× {item.orderItem.nameSnapshot}
                          {item.status === "DELAYED" ? " (delayed)" : ""}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          {order.assembled ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-success">Assembled</p>
              <Button
                disabled={pass.isPending}
                onClick={() =>
                  pass.mutate(order.orderId, {
                    onSuccess: () => toast.success("Passed to the floor"),
                    onError: (err) => fail(err, "Could not pass the order"),
                  })
                }
              >
                Pass to floor
              </Button>
            </div>
          ) : (
            <Button
              disabled={!order.allReady || assemble.isPending}
              onClick={() =>
                assemble.mutate(order.orderId, {
                  onSuccess: () => toast.success("Order assembled"),
                  onError: (err) => fail(err, "Could not assemble"),
                })
              }
            >
              {order.allReady ? "Mark assembled" : "Waiting on stations"}
            </Button>
          )}
        </Card>
      ))}
      {board.data && board.data.length === 0 && (
        <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
          No open kitchen tickets to assemble.
        </p>
      )}
    </div>
  );
}
