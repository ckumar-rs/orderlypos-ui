"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";

interface Device {
  id: string;
  name: string;
  online: boolean;
  appVersion: string | null;
  lastSeenAt: string | null;
  config: { message?: string };
}

export default function DevicesPage() {
  const { branchId } = useBranch();
  const queryClient = useQueryClient();
  const devices = useQuery({
    queryKey: ["devices", branchId],
    queryFn: () => api.get<Device[]>(`/platform/devices?branchId=${branchId}`),
    enabled: !!branchId,
  });
  const [messages, setMessages] = useState<Record<string, string>>({});
  return (
    <div className="flex flex-col gap-4">
      <SettingsTabs />
      <div>
        <h1 className="text-2xl font-semibold">Devices</h1>
        <p className="text-sm text-muted-foreground">The POS registers itself. A message here shows on that register.</p>
      </div>
      <div className="grid gap-3">
        {(devices.data ?? []).map((device) => (
          <Card key={device.id} className="flex flex-col gap-2 p-4">
            <p className="font-medium">{device.name} · {device.online ? "Online" : "Offline"}</p>
            <p className="text-sm text-muted-foreground">
              {device.appVersion || "No version"} · {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "Never seen"}
            </p>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                api
                  .put(`/platform/devices/${device.id}?branchId=${branchId}`, {
                    config: { message: messages[device.id] ?? device.config?.message ?? "" },
                  })
                  .then(() => {
                    toast.success("Config sent");
                    void queryClient.invalidateQueries({ queryKey: ["devices", branchId] });
                  })
                  .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save"));
              }}
            >
              <Input
                value={messages[device.id] ?? device.config?.message ?? ""}
                onChange={(event) => setMessages((current) => ({ ...current, [device.id]: event.target.value }))}
                placeholder="Message for this register"
              />
              <Button type="submit">Save</Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
