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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, api } from "@/lib/api";

interface CatalogProduct {
  menuItemId: string;
  name: string;
  price: number;
  isActive: boolean;
  retailerId: string;
  syncStatus: string;
  attempts: number;
  lastError: string | null;
  lastSyncedAt: string | null;
}

interface CatalogSubmission {
  messageId: string;
  submissionStatus: string;
  rejectionReason: string | null;
  orderNumber: string | null;
  orderStatus: string | null;
  createdAt: string;
}

interface CatalogConnection {
  connected: boolean;
  connectionStatus: string;
  phoneNumberId: string;
  wabaId: string;
  catalogId: string;
  businessPhone: string | null;
  accessTokenConfigured: boolean;
  webhookPath: string;
  lastWebhookAt: string | null;
  verifyToken?: string;
  products: CatalogProduct[];
  submissions: CatalogSubmission[];
}

const STATUS: Record<string, string> = {
  SYNCED: "Meta accepted",
  OUT_OF_STOCK: "Out of stock",
  PENDING: "Waiting",
  FAILED: "Failed",
};

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");

export default function WhatsAppCatalogPage() {
  const { branchId } = useBranch();
  const { data: me, isLoading: userLoading } = useCurrentUser();
  const canManage = hasPermission(me?.user, "settings.manage");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-catalog", branchId],
    queryFn: () => api.get<CatalogConnection>(`/whatsapp/catalog?branchId=${branchId}`),
    enabled: !!branchId && canManage,
  });

  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  useEffect(() => {
    if (!data) return;
    setPhoneNumberId(data.phoneNumberId ?? "");
    setWabaId(data.wabaId ?? "");
    setCatalogId(data.catalogId ?? "");
    setBusinessPhone(data.businessPhone ?? "");
  }, [data]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["whatsapp-catalog", branchId] });
  const onError = (e: unknown) => toast.error(errMsg(e));

  const connect = useMutation({
    mutationFn: () =>
      api.post<CatalogConnection>(`/whatsapp/catalog/connect?branchId=${branchId}`, {
        phoneNumberId,
        wabaId,
        catalogId,
        businessPhone: businessPhone.trim() || null,
        accessToken: accessToken.trim() || null,
      }),
    onSuccess: (row) => {
      setAccessToken("");
      setVerifyToken(row.verifyToken ?? "");
      toast.success("WhatsApp catalog is connected");
      refresh();
    },
    onError,
  });
  const disconnect = useMutation({
    mutationFn: () => api.post(`/whatsapp/catalog/disconnect?branchId=${branchId}`, {}),
    onSuccess: () => {
      setVerifyToken("");
      toast.success("WhatsApp catalog is disconnected");
      refresh();
    },
    onError,
  });
  const sync = useMutation({
    mutationFn: () => api.post(`/whatsapp/catalog/sync?branchId=${branchId}`, {}),
    onSuccess: () => {
      toast.success("Catalog sync sent to Meta");
      refresh();
    },
    onError,
  });
  const retry = useMutation({
    mutationFn: (menuItemId: string) =>
      api.post(`/whatsapp/catalog/products/${menuItemId}/retry?branchId=${branchId}`, {}),
    onSuccess: () => {
      toast.success("Item sent again");
      refresh();
    },
    onError,
  });

  const webhookUrl = (typeof window === "undefined" ? "" : window.location.origin) + (data?.webhookPath ?? "");
  const busy = connect.isPending || disconnect.isPending || sync.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Restaurant, branch, and staff configuration</p>
      </div>
      <SettingsTabs />

      <div className="flex max-w-3xl flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">WhatsApp catalog</h2>
        <p className="text-sm text-muted-foreground">
          Store the Meta phone number id, WhatsApp business account id, and catalog id for this branch.
          The access token is sealed and is not shown again. A guest who messages this number receives the
          catalog. Their cart becomes a takeaway on Orders → WhatsApp, and the counter accepts it before the
          kitchen starts. A voice note is matched to dishes on this menu when speech is turned on for the API.
          If a UPI id is stored, the guest receives a QR that PhonePe, WhatsApp, or any UPI app
          can scan for that amount. After the cashier confirms the payment, the guest receives the paid receipt as a PDF.
          Meta accepting a dish does not confirm WhatsApp is showing it.
        </p>
      </div>

      {userLoading || !branchId || (canManage && isLoading) ? (
        <Skeleton className="h-40 w-full" />
      ) : !canManage ? (
        <p className="text-sm text-muted-foreground">You need settings access to connect a catalog.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wa-phone">Phone number id</Label>
                <Input id="wa-phone" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wa-waba">WhatsApp business account id</Label>
                <Input id="wa-waba" value={wabaId} onChange={(e) => setWabaId(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wa-catalog">Catalog id</Label>
                <Input id="wa-catalog" value={catalogId} onChange={(e) => setCatalogId(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wa-business-phone">Business phone</Label>
                <Input id="wa-business-phone" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wa-token">Access token</Label>
                <Input
                  id="wa-token"
                  type="password"
                  value={accessToken}
                  placeholder={data?.accessTokenConfigured ? "Saved. Paste a new token to replace it." : "Paste the token"}
                  onChange={(e) => setAccessToken(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Status: {data?.connectionStatus ?? "DISCONNECTED"}. Webhook {webhookUrl}
            </p>
            {verifyToken ? (
              <p className="text-sm text-foreground">
                Verify token, shown once: <span className="font-mono">{verifyToken}</span>
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={busy} onClick={() => connect.mutate()}>
                {data?.connected ? "Save connection" : "Connect"}
              </Button>
              <Button type="button" variant="outline" disabled={busy || !data?.connected} onClick={() => disconnect.mutate()}>
                Disconnect
              </Button>
              <Button type="button" variant="outline" disabled={busy || !data?.connected} onClick={() => sync.mutate()}>
                Sync menu
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dish</TableHead>
                  <TableHead>Retailer id</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.products ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Sync the menu to list dishes. Each retailer id stays the menu item id.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.products.map((row) => (
                    <TableRow key={row.menuItemId}>
                      <TableCell>
                        {row.name}
                        {!row.isActive ? " (off)" : ""}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.retailerId}</TableCell>
                      <TableCell>{STATUS[row.syncStatus] ?? row.syncStatus}</TableCell>
                      <TableCell className="text-muted-foreground">{row.lastError ?? ""}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!data?.connected || retry.isPending}
                          onClick={() => retry.mutate(row.menuItemId)}
                        >
                          Retry
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
          <Card className="p-4">
            <p className="mb-3 text-sm font-medium">Catalog carts</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.submissions ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      A cart from WhatsApp will show here after Meta delivers it.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.submissions.map((row) => (
                    <TableRow key={row.messageId}>
                      <TableCell className="font-mono text-xs">{row.messageId}</TableCell>
                      <TableCell>{row.submissionStatus}</TableCell>
                      <TableCell>{row.orderNumber ? `#${row.orderNumber}` : ""}</TableCell>
                      <TableCell className="text-muted-foreground">{row.rejectionReason ?? ""}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
