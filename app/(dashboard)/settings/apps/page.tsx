"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, api } from "@/lib/api";

interface AppRow {
  id: string;
  name: string;
  enabled: boolean;
  baseUrl: string | null;
}

export default function InstalledAppsPage() {
  const qc = useQueryClient();
  const apps = useQuery({
    queryKey: ["installed-apps"],
    queryFn: () => api.get<AppRow[]>("/service/apps"),
  });
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [secret, setSecret] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <SettingsTabs />
      <div>
        <h1 className="text-lg font-semibold">Installed apps</h1>
        <p className="text-sm text-muted-foreground">An enabled app with a URL and a secret receives the same signed events as webhooks. An empty URL or secret is not called. There is no app catalog.</p>
      </div>
      <Card className="grid gap-2 p-4">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="App name" />
        <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://vendor.example/hook" />
        <Input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Secret, leave blank to keep the stored one" type="password" />
        <Button type="button" onClick={() => api.post("/service/apps", { name, enabled: true, baseUrl: baseUrl || null, secret: secret || null }).then(() => { setName(""); setBaseUrl(""); setSecret(""); toast.success("App saved"); qc.invalidateQueries({ queryKey: ["installed-apps"] }); }).catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save"))}>Save app</Button>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {(apps.data ?? []).map((app) => (
          <Card key={app.id} className="p-4">
            <p className="font-medium">{app.name}</p>
            <p className="text-sm text-muted-foreground">{app.enabled ? "Enabled" : "Off"} · {app.baseUrl || "No URL"}</p>
            <Button type="button" variant="outline" className="mt-3" onClick={() => api.post<{ statusCode: number }>(`/service/apps/${app.id}/test`).then((row) => toast.success(`Test answered HTTP ${row.statusCode}`)).catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not reach the app"))}>Send a test event</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
