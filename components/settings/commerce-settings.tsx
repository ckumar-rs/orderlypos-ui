"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomers } from "@/hooks/use-customers";
import { ApiError, api } from "@/lib/api";

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");

function originPath(path: string) {
  if (typeof window === "undefined") return path;
  return window.location.origin + path;
}

export interface GatewayRow {
  provider: string;
  enabled: boolean;
  baseUrl: string | null;
  keyId: string | null;
  secretConfigured: boolean;
  webhookSecretConfigured: boolean;
  webhookPath: string;
}

export function GatewayCard({ row, onSaved }: { row: GatewayRow; onSaved: () => void }) {
  const [baseUrl, setBaseUrl] = useState(row.baseUrl ?? "");
  const [keyId, setKeyId] = useState(row.keyId ?? "");
  const [secret, setSecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [enabled, setEnabled] = useState(row.enabled);
  useEffect(() => {
    setBaseUrl(row.baseUrl ?? "");
    setKeyId(row.keyId ?? "");
    setEnabled(row.enabled);
  }, [row.baseUrl, row.keyId, row.enabled]);
  const save = useMutation({
    mutationFn: () =>
      api.post(`/commerce/gateways/${row.provider}`, {
        enabled,
        baseUrl: baseUrl.trim() || null,
        keyId: keyId.trim() || null,
        secret: secret.trim() || null,
        webhookSecret: webhookSecret.trim() || null,
      }),
    onSuccess: () => {
      setSecret("");
      setWebhookSecret("");
      toast.success(`${row.provider} saved`);
      onSaved();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{row.provider}</p>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>
      </div>
      <Label htmlFor={`${row.provider}-url`}>API URL</Label>
      <Input id={`${row.provider}-url`} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://…" />
      <Label htmlFor={`${row.provider}-key`}>Key id</Label>
      <Input id={`${row.provider}-key`} value={keyId} onChange={(e) => setKeyId(e.target.value)} />
      <Label htmlFor={`${row.provider}-secret`}>Secret</Label>
      <Input id={`${row.provider}-secret`} type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={row.secretConfigured ? "Secret stored. Type to replace it." : "Secret"} autoComplete="off" />
      <Label htmlFor={`${row.provider}-hook`}>Webhook secret</Label>
      <Input id={`${row.provider}-hook`} type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder={row.webhookSecretConfigured ? "Webhook secret stored. Type to replace it." : "Webhook secret"} autoComplete="off" />
      <p className="font-mono text-[11px] text-muted-foreground">{originPath(row.webhookPath)}</p>
      <Button type="button" disabled={save.isPending} onClick={() => save.mutate()}>Save</Button>
    </Card>
  );
}

export interface TerminalRow {
  id: string;
  provider: string;
  name: string;
  enabled: boolean;
  baseUrl: string | null;
  merchantId: string | null;
  terminalId: string | null;
  secretConfigured: boolean;
}

const TERMINAL_PROVIDERS = ["PINELABS", "MOSAMBEE", "MSWIPE", "PAX"];

export function TerminalForm({
  branchId,
  row,
  onSaved,
}: {
  branchId: string;
  row?: TerminalRow;
  onSaved: () => void;
}) {
  const [provider, setProvider] = useState(row?.provider ?? "PINELABS");
  const [name, setName] = useState(row?.name ?? "");
  const [enabled, setEnabled] = useState(row?.enabled ?? true);
  const [baseUrl, setBaseUrl] = useState(row?.baseUrl ?? "");
  const [merchantId, setMerchantId] = useState(row?.merchantId ?? "");
  const [terminalId, setTerminalId] = useState(row?.terminalId ?? "");
  const [secret, setSecret] = useState("");
  useEffect(() => {
    if (!row) return;
    setProvider(row.provider);
    setName(row.name);
    setEnabled(row.enabled);
    setBaseUrl(row.baseUrl ?? "");
    setMerchantId(row.merchantId ?? "");
    setTerminalId(row.terminalId ?? "");
  }, [row]);
  const save = useMutation({
    mutationFn: () =>
      api.post(`/commerce/terminals?branchId=${branchId}`, {
        id: row?.id,
        provider,
        name,
        enabled,
        baseUrl: baseUrl.trim() || null,
        merchantId: merchantId.trim() || null,
        terminalId: terminalId.trim() || null,
        secret: secret.trim() || null,
      }),
    onSuccess: () => {
      setSecret("");
      if (!row) {
        setName("");
        setBaseUrl("");
        setMerchantId("");
        setTerminalId("");
      }
      toast.success(row ? "Terminal saved" : "Terminal added");
      onSaved();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const prefix = row?.id ?? "new";
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{row ? row.name : "New terminal"}</p>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>
      </div>
      <Label htmlFor={`${prefix}-provider`}>Provider</Label>
      <select id={`${prefix}-provider`} value={provider} onChange={(e) => setProvider(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
        {TERMINAL_PROVIDERS.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
      <Label htmlFor={`${prefix}-name`}>Name</Label>
      <Input id={`${prefix}-name`} value={name} onChange={(e) => setName(e.target.value)} />
      <Label htmlFor={`${prefix}-url`}>Push URL</Label>
      <Input id={`${prefix}-url`} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://…" />
      <Label htmlFor={`${prefix}-merchant`}>Merchant id</Label>
      <Input id={`${prefix}-merchant`} value={merchantId} onChange={(e) => setMerchantId(e.target.value)} />
      <Label htmlFor={`${prefix}-terminal`}>Terminal id</Label>
      <Input id={`${prefix}-terminal`} value={terminalId} onChange={(e) => setTerminalId(e.target.value)} />
      <Label htmlFor={`${prefix}-secret`}>Secret</Label>
      <Input id={`${prefix}-secret`} type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={row?.secretConfigured ? "Secret stored. Type to replace it." : "Secret"} autoComplete="off" />
      <p className="font-mono text-[11px] text-muted-foreground">{originPath(`/api/v1/public/edc/${provider.toLowerCase()}`)}</p>
      <Button type="button" disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}>
        {row ? "Save" : "Add terminal"}
      </Button>
    </Card>
  );
}

export interface HouseRow {
  id: string;
  name: string;
  notes: string | null;
  customerId: string | null;
  customerName: string | null;
  creditLimit: number;
  balance: number;
}

export function HouseForm({
  branchId,
  row,
  onSaved,
}: {
  branchId: string;
  row?: HouseRow;
  onSaved: () => void;
}) {
  const customers = useCustomers(branchId);
  const [name, setName] = useState(row?.name ?? "");
  const [limit, setLimit] = useState(row ? String(row.creditLimit) : "0");
  const [notes, setNotes] = useState(row?.notes ?? "");
  const [customerId, setCustomerId] = useState(row?.customerId ?? "");
  useEffect(() => {
    if (!row) return;
    setName(row.name);
    setLimit(String(row.creditLimit));
    setNotes(row.notes ?? "");
    setCustomerId(row.customerId ?? "");
  }, [row]);
  const save = useMutation({
    mutationFn: () => {
      const body = {
        name,
        creditLimit: Number(limit) || 0,
        notes: notes.trim() || null,
        customerId: customerId || null,
      };
      return row
        ? api.patch(`/commerce/house-accounts/${row.id}?branchId=${branchId}`, body)
        : api.post(`/commerce/house-accounts?branchId=${branchId}`, body);
    },
    onSuccess: () => {
      if (!row) {
        setName("");
        setLimit("0");
        setNotes("");
        setCustomerId("");
      }
      toast.success(row ? "House account saved" : "House account created");
      onSaved();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const prefix = row?.id ?? "new-house";
  return (
    <Card className="flex flex-col gap-3 p-4">
      <p className="text-sm font-semibold">{row ? row.name : "New house account"}</p>
      {row ? <p className="text-xs text-muted-foreground">Balance {row.balance}. Change it by posting an advance or a charge.</p> : null}
      <Label htmlFor={`${prefix}-name`}>Name</Label>
      <Input id={`${prefix}-name`} value={name} onChange={(e) => setName(e.target.value)} />
      <Label htmlFor={`${prefix}-customer`}>Customer</Label>
      <select id={`${prefix}-customer`} value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
        <option value="">No customer</option>
        {(customers.data ?? []).map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name || customer.phone || customer.id}
          </option>
        ))}
      </select>
      <Label htmlFor={`${prefix}-limit`}>Credit limit</Label>
      <Input id={`${prefix}-limit`} value={limit} onChange={(e) => setLimit(e.target.value)} />
      <Label htmlFor={`${prefix}-notes`}>Notes</Label>
      <Input id={`${prefix}-notes`} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button type="button" disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}>
        {row ? "Save" : "Create account"}
      </Button>
    </Card>
  );
}

export interface FleetRow {
  provider: string;
  enabled: boolean;
  baseUrl: string | null;
  apiKeyConfigured: boolean;
  webhookPath: string;
}

export function FleetCard({ branchId, row, onSaved }: { branchId: string; row: FleetRow; onSaved: () => void }) {
  const [baseUrl, setBaseUrl] = useState(row.baseUrl ?? "");
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(row.enabled);
  useEffect(() => {
    setBaseUrl(row.baseUrl ?? "");
    setEnabled(row.enabled);
  }, [row.baseUrl, row.enabled]);
  const save = useMutation({
    mutationFn: () =>
      api.post(`/commerce/fleet/${row.provider}?branchId=${branchId}`, {
        enabled,
        baseUrl: baseUrl.trim() || null,
        apiKey: apiKey.trim() || null,
      }),
    onSuccess: () => {
      setApiKey("");
      toast.success(`${row.provider} saved`);
      onSaved();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{row.provider}</p>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>
      </div>
      <Label htmlFor={`${row.provider}-url`}>Dispatch URL</Label>
      <Input id={`${row.provider}-url`} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://…" />
      <Label htmlFor={`${row.provider}-key`}>API key</Label>
      <Input id={`${row.provider}-key`} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={row.apiKeyConfigured ? "Key stored. Type to replace it." : "API key"} autoComplete="off" />
      <p className="font-mono text-[11px] text-muted-foreground">{originPath(row.webhookPath)}</p>
      <Button type="button" disabled={save.isPending} onClick={() => save.mutate()}>Save</Button>
    </Card>
  );
}
