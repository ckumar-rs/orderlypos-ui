"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";

interface FoodPlatformConnection {
  platform: "ZOMATO" | "SWIGGY";
  label: string;
  enabled: boolean;
  outletId: string | null;
  secret: string | null;
  webhookPath: string;
  apiBaseUrl: string | null;
  apiKeyConfigured: boolean;
  storeOpen: boolean;
  riderWebhookPath: string;
}

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");

function copyText(value: string) {
  void navigator.clipboard.writeText(value).then(
    () => toast.success("Copied"),
    () => toast.error("Could not copy"),
  );
}

function PlatformCard({
  row,
  branchId,
}: {
  row: FoodPlatformConnection;
  branchId: string;
}) {
  const qc = useQueryClient();
  const [outlet, setOutlet] = useState(row.outletId ?? "");
  const [apiUrl, setApiUrl] = useState(row.apiBaseUrl ?? "");
  const [apiKey, setApiKey] = useState("");
  const [storeOpen, setStoreOpen] = useState(row.storeOpen ?? true);
  useEffect(() => setOutlet(row.outletId ?? ""), [row.outletId]);
  useEffect(() => setApiUrl(row.apiBaseUrl ?? ""), [row.apiBaseUrl]);
  useEffect(() => setStoreOpen(row.storeOpen ?? true), [row.storeOpen]);

  const slug = row.platform.toLowerCase();
  const webhookUrl =
    (typeof window === "undefined" ? "" : window.location.origin) + row.webhookPath;

  const refresh = () => qc.invalidateQueries({ queryKey: ["food-platforms", branchId] });
  const onError = (e: unknown) => toast.error(errMsg(e));

  const enable = useMutation({
    mutationFn: () =>
      api.post<FoodPlatformConnection>(`/food-platforms/${slug}/enable?branchId=${branchId}`, {
        outletId: outlet.trim() || null,
      }),
    onSuccess: () => {
      toast.success(`${row.label} intake is on`);
      refresh();
    },
    onError,
  });
  const disable = useMutation({
    mutationFn: () => api.post(`/food-platforms/${slug}/disable?branchId=${branchId}`, {}),
    onSuccess: () => {
      toast.success(`${row.label} intake is off`);
      refresh();
    },
    onError,
  });
  const rotate = useMutation({
    mutationFn: () =>
      api.post<FoodPlatformConnection>(`/food-platforms/${slug}/rotate?branchId=${branchId}`, {}),
    onSuccess: () => {
      toast.success("Secret replaced. Update the relay.");
      refresh();
    },
    onError,
  });
  const saveOutlet = useMutation({
    mutationFn: () =>
      api.patch(`/food-platforms/${slug}?branchId=${branchId}`, {
        outletId: outlet.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Outlet id saved");
      refresh();
    },
    onError,
  });

  const busy = enable.isPending || disable.isPending || rotate.isPending || saveOutlet.isPending;

  return (
    <Card className="flex max-w-3xl flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{row.label}</h2>
          <p className="text-sm text-muted-foreground">
            {row.enabled
              ? "Accepting orders for this branch."
              : "Off. Orders for this platform are rejected until you turn it on."}
          </p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
          {row.enabled ? "On" : "Off"}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${slug}-url`}>Webhook URL</Label>
        <div className="flex gap-2">
          <Input id={`${slug}-url`} readOnly value={webhookUrl} className="font-mono text-xs" />
          <Button type="button" variant="outline" onClick={() => copyText(webhookUrl)}>
            Copy
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${slug}-secret`}>Secret</Label>
        <div className="flex gap-2">
          <Input
            id={`${slug}-secret`}
            readOnly
            value={row.secret ?? ""}
            placeholder={row.enabled ? "Secret could not be read. Replace it." : "Turn intake on to create a secret"}
            className="font-mono text-xs"
          />
          <Button type="button" variant="outline" disabled={!row.secret} onClick={() => row.secret && copyText(row.secret)}>
            Copy
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Send it as the <span className="font-mono">X-Platform-Secret</span> header, or as{" "}
          <span className="font-mono">Authorization: Bearer</span>.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${slug}-outlet`}>Outlet id (optional)</Label>
        <div className="flex gap-2">
          <Input
            id={`${slug}-outlet`}
            value={outlet}
            onChange={(e) => setOutlet(e.target.value)}
            placeholder="Only if the payload includes an outlet or restaurant id"
          />
          <Button
            type="button"
            variant="outline"
            disabled={(!row.secret && !row.enabled) || busy}
            onClick={() => saveOutlet.mutate()}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${slug}-api`}>Outbound API URL</Label>
        <Input
          id={`${slug}-api`}
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="Stored URL. Empty means menu, store, and stock-out stay off."
        />
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={row.apiKeyConfigured ? "API key stored. Type to replace it." : "API key"}
          autoComplete="off"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={storeOpen} onChange={(e) => setStoreOpen(e.target.checked)} />
          Store is open
        </label>
        <p className="text-xs text-muted-foreground">
          Rider status webhook: {row.riderWebhookPath}. Save API stores this without calling the platform.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!row.enabled || busy}
            onClick={() =>
              api
                .post(`/food-platforms/${slug}/api?branchId=${branchId}`, {
                  apiBaseUrl: apiUrl.trim() || null,
                  apiKey: apiKey.trim() || null,
                  storeOpen,
                })
                .then(() => {
                  setApiKey("");
                  toast.success("API settings saved");
                  refresh();
                })
                .catch(onError)
            }
          >
            Save API
          </Button>
          <Button type="button" variant="outline" disabled={!row.apiKeyConfigured || busy} onClick={() => api.post(`/food-platforms/${slug}/publish-menu?branchId=${branchId}`, {}).then(() => toast.success("Menu sent")).catch(onError)}>
            Publish menu
          </Button>
          <Button type="button" variant="outline" disabled={!row.apiKeyConfigured || busy} onClick={() => api.post(`/food-platforms/${slug}/store?branchId=${branchId}`, { open: !storeOpen }).then(() => { toast.success("Store status sent"); refresh(); }).catch(onError)}>
            {storeOpen ? "Mark store closed" : "Mark store open"}
          </Button>
          <Button type="button" variant="outline" disabled={!row.apiKeyConfigured || busy} onClick={() => api.post(`/food-platforms/${slug}/stock-out?branchId=${branchId}`, { itemIds: [] }).then(() => toast.success("Stock-out sent")).catch(onError)}>
            Push stock-out
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {row.enabled ? (
          <Button type="button" variant="outline" disabled={busy} onClick={() => disable.mutate()}>
            Turn off
          </Button>
        ) : (
          <Button type="button" disabled={busy} onClick={() => enable.mutate()}>
            Turn on
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={(!row.secret && !row.enabled) || busy}
          onClick={() => {
            if (window.confirm("Replace the secret? The old one stops working immediately.")) {
              rotate.mutate();
            }
          }}
        >
          Replace secret
        </Button>
      </div>
    </Card>
  );
}

export default function FoodPlatformsPage() {
  const { branchId } = useBranch();
  const { data: me, isLoading: userLoading } = useCurrentUser();
  const canManage = hasPermission(me?.user, "settings.manage");
  const { data, isLoading } = useQuery({
    queryKey: ["food-platforms", branchId],
    queryFn: () => api.get<FoodPlatformConnection[]>(`/food-platforms?branchId=${branchId}`),
    enabled: !!branchId && canManage,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Restaurant, branch, and staff configuration</p>
      </div>
      <SettingsTabs />

      <div className="flex max-w-3xl flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">Zomato and Swiggy order intake</h2>
        <p className="text-sm text-muted-foreground">
          Paste the webhook URL and secret into the relay that receives orders from Zomato or Swiggy.
          A dish is accepted when its name matches this branch&apos;s menu, ignoring letter case. If any
          line does not match, the order is refused and nothing is created. Repeating the same order id
          returns the original ticket. Their rider delivers, so your delivery zones are not applied, and
          the ticket uses this menu&apos;s prices.
        </p>
        <pre className="overflow-x-auto rounded-xl bg-secondary p-3 font-mono text-xs text-foreground">{`{
  "order_id": "Z-1001",
  "customer_name": "Meera Iyer",
  "phone": "9845012345",
  "address": "12 Lake View Apartments, Banjara Hills",
  "pincode": "500034",
  "items": [{ "name": "Paneer Tikka", "quantity": 1 }]
}`}</pre>
      </div>

      {userLoading ? (
        <Skeleton className="h-40 max-w-3xl" />
      ) : !canManage ? (
        <p className="text-sm text-muted-foreground">You need settings access to manage food platforms.</p>
      ) : isLoading || !data ? (
        <Skeleton className="h-40 max-w-3xl" />
      ) : (
        data.map((row) => <PlatformCard key={row.platform} row={row} branchId={branchId ?? ""} />)
      )}
    </div>
  );
}
