"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import type { KitchenCourse, KitchenStation } from "@/hooks/use-menu";

export function KitchenSetupCard({ branchId }: { branchId: string | null }) {
  const queryClient = useQueryClient();
  const { data: stations } = useQuery({
    queryKey: ["menu", "stations", branchId],
    queryFn: () => api.get<KitchenStation[]>(`/menu/stations?branchId=${branchId}`),
    enabled: !!branchId,
  });
  const { data: courses } = useQuery({
    queryKey: ["menu", "courses", branchId],
    queryFn: () => api.get<KitchenCourse[]>(`/menu/courses?branchId=${branchId}`),
    enabled: !!branchId,
  });
  const [stationName, setStationName] = useState("");
  const [stationRole, setStationRole] = useState("COOK");
  const [courseName, setCourseName] = useState("");
  const [holdByDefault, setHoldByDefault] = useState(false);

  const createStation = useMutation({
    mutationFn: () =>
      api.post(`/menu/stations?branchId=${branchId}`, { name: stationName, role: stationRole }),
    onSuccess: () => {
      toast.success("Station saved");
      setStationName("");
      queryClient.invalidateQueries({ queryKey: ["menu", "stations", branchId] });
      queryClient.invalidateQueries({ queryKey: ["kds", "stations", branchId] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save station"),
  });
  const createCourse = useMutation({
    mutationFn: () =>
      api.post(`/menu/courses?branchId=${branchId}`, { name: courseName, holdByDefault }),
    onSuccess: () => {
      toast.success("Course saved");
      setCourseName("");
      queryClient.invalidateQueries({ queryKey: ["menu", "courses", branchId] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save course"),
  });
  const deleteCourse = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/courses/${id}?branchId=${branchId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu", "courses", branchId] }),
  });

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">Kitchen stations and courses</p>
        <p className="text-xs text-muted-foreground">
          Cook stations receive tickets. An Expo station is the assembly screen. Courses can hold
          tickets (for example desserts) until someone fires them.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          {(stations ?? []).map((station) => (
            <p key={station.id} className="text-sm text-muted-foreground">
              {station.name}
              {station.role === "EXPO" ? " · Expo" : ""}
            </p>
          ))}
          <form
            className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              createStation.mutate();
            }}
          >
            <Input
              aria-label="Station name"
              placeholder="Grill"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              required
            />
            <select
              aria-label="Station role"
              value={stationRole}
              onChange={(e) => setStationRole(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-2 text-sm"
            >
              <option value="COOK">Cook</option>
              <option value="EXPO">Expo</option>
            </select>
            <Button type="submit" disabled={!branchId || createStation.isPending}>
              Add station
            </Button>
          </form>
        </div>
        <div className="flex flex-col gap-2">
          {(courses ?? []).map((course) => (
            <div key={course.id} className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                {course.name}
                {course.holdByDefault ? " · hold until fired" : ""}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => deleteCourse.mutate(course.id)}>
                Remove
              </Button>
            </div>
          ))}
          <form
            className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              createCourse.mutate();
            }}
          >
            <Input
              aria-label="Course name"
              placeholder="Desserts"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              required
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={holdByDefault}
                onChange={(e) => setHoldByDefault(e.target.checked)}
              />
              Hold by default
            </label>
            <Button type="submit" disabled={!branchId || createCourse.isPending}>
              Add course
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
