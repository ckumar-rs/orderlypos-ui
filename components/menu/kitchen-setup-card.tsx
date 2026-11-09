"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MenuSectionHeader } from "@/components/menu/menu-section-header";
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
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [courseName, setCourseName] = useState("");
  const [holdByDefault, setHoldByDefault] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const refreshStations = () => {
    queryClient.invalidateQueries({ queryKey: ["menu", "stations", branchId] });
    queryClient.invalidateQueries({ queryKey: ["kds", "stations", branchId] });
  };
  const refreshCourses = () =>
    queryClient.invalidateQueries({ queryKey: ["menu", "courses", branchId] });

  const saveStation = useMutation({
    mutationFn: () =>
      editingStationId
        ? api.patch(`/menu/stations/${editingStationId}?branchId=${branchId}`, {
            name: stationName,
            role: stationRole,
          })
        : api.post(`/menu/stations?branchId=${branchId}`, {
            name: stationName,
            role: stationRole,
          }),
    onSuccess: () => {
      toast.success(editingStationId ? "Station updated" : "Station saved");
      setStationName("");
      setStationRole("COOK");
      setEditingStationId(null);
      refreshStations();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Could not save station"),
  });
  const deleteStation = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/stations/${id}?branchId=${branchId}`),
    onSuccess: () => {
      toast.success("Station removed");
      refreshStations();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Could not remove station"),
  });
  const saveCourse = useMutation({
    mutationFn: () =>
      editingCourseId
        ? api.patch(`/menu/courses/${editingCourseId}?branchId=${branchId}`, {
            name: courseName,
            holdByDefault,
          })
        : api.post(`/menu/courses?branchId=${branchId}`, { name: courseName, holdByDefault }),
    onSuccess: () => {
      toast.success(editingCourseId ? "Course updated" : "Course saved");
      setCourseName("");
      setHoldByDefault(false);
      setEditingCourseId(null);
      refreshCourses();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Could not save course"),
  });
  const deleteCourse = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/courses/${id}?branchId=${branchId}`),
    onSuccess: () => {
      toast.success("Course removed");
      refreshCourses();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Could not remove course"),
  });

  return (
    <Card className="flex flex-col gap-5 p-4 sm:p-6">
      <MenuSectionHeader
        title="Kitchen setup"
        description="Cook stations receive tickets. Expo is the assembly screen. Empty branches auto-seed Starters / Mains / Desserts (desserts hold until fired). Assign courses on menu items so Pass Fire next fills automatically."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/20 p-4">
          <h3 className="text-sm font-semibold text-foreground">Stations</h3>
          <div className="flex flex-col gap-2">
            {(stations ?? []).map((station) => (
              <div
                key={station.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              >
                <span>
                  {station.name}
                  {station.role === "EXPO" ? " · Expo" : ""}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingStationId(station.id);
                      setStationName(station.name);
                      setStationRole(station.role === "EXPO" ? "EXPO" : "COOK");
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      if (!confirm(`Remove station ${station.name}?`)) return;
                      deleteStation.mutate(station.id);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <form
            className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              saveStation.mutate();
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
            <div className="flex gap-1">
              {editingStationId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingStationId(null);
                    setStationName("");
                    setStationRole("COOK");
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={!branchId || saveStation.isPending}>
                {editingStationId ? "Save" : "Add station"}
              </Button>
            </div>
          </form>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/20 p-4">
          <h3 className="text-sm font-semibold text-foreground">Courses</h3>
          <div className="flex flex-col gap-2">
            {(courses ?? []).map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              >
                <span>
                  {course.name}
                  {course.holdByDefault ? " · hold until fired" : ""}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingCourseId(course.id);
                      setCourseName(course.name);
                      setHoldByDefault(course.holdByDefault);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      if (!confirm(`Remove course ${course.name}?`)) return;
                      deleteCourse.mutate(course.id);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <form
            className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              saveCourse.mutate();
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
            <div className="flex gap-1">
              {editingCourseId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingCourseId(null);
                    setCourseName("");
                    setHoldByDefault(false);
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={!branchId || saveCourse.isPending}>
                {editingCourseId ? "Save" : "Add course"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Card>
  );
}
