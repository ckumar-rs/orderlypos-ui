"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api";

export default function NetworkPage() {
  const [ipAllowList, setIpAllowList] = useState("");
  const [requireDevice, setRequireDevice] = useState(false);
  const [requestIp, setRequestIp] = useState("");
  useEffect(() => {
    api
      .get<{ ipAllowList: string; requireDevice: boolean; requestIp: string }>("/platform/security")
      .then((row) => {
        setIpAllowList(row.ipAllowList);
        setRequireDevice(row.requireDevice);
        setRequestIp(row.requestIp);
      })
      .catch(() => undefined);
  }, []);
  return (
    <div className="flex flex-col gap-4">
      <SettingsTabs />
      <div>
        <h1 className="text-2xl font-semibold">Network</h1>
        <p className="text-sm text-muted-foreground">
          Leave the list empty to allow every network. This page stays open so a bad list cannot lock you out. The API currently sees {requestIp || "an unknown address"}.
        </p>
      </div>
      <Card className="flex max-w-xl flex-col gap-3 p-4">
        <Label htmlFor="ips">Allowed addresses</Label>
        <Input id="ips" value={ipAllowList} onChange={(event) => setIpAllowList(event.target.value)} placeholder="203.0.113.5, 203.0.113.6" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={requireDevice} onChange={(event) => setRequireDevice(event.target.checked)} />
          Require a registered device
        </label>
        <Button
          type="button"
          onClick={() =>
            api
              .put("/platform/security", { ipAllowList, requireDevice })
              .then(() => toast.success("Network rules saved"))
              .catch((error) => toast.error(error instanceof ApiError ? error.message : "Could not save"))
          }
        >
          Save
        </Button>
      </Card>
    </div>
  );
}
