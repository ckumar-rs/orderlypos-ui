"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateRestaurantSettings, type RestaurantSettings } from "@/hooks/use-settings";
import { ApiError } from "@/lib/api";

export function OpsConfigCard({
  restaurant,
  branchId,
}: {
  restaurant: RestaurantSettings;
  branchId: string | null;
}) {
  const update = useUpdateRestaurantSettings(branchId);
  const [smtpHost, setSmtpHost] = useState(restaurant.smtpHost ?? "");
  const [smtpPort, setSmtpPort] = useState(String(restaurant.smtpPort ?? 587));
  const [smtpUser, setSmtpUser] = useState(restaurant.smtpUser ?? "");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFrom, setSmtpFrom] = useState(restaurant.smtpFrom ?? "");
  const [smtpSecure, setSmtpSecure] = useState(Boolean(restaurant.smtpSecure));
  const [tallyEnabled, setTallyEnabled] = useState(Boolean(restaurant.tallyEnabled));
  const [tallyCompanyName, setTallyCompanyName] = useState(restaurant.tallyCompanyName ?? "");
  const [tallyHost, setTallyHost] = useState(restaurant.tallyHost ?? "");
  const [tallyPort, setTallyPort] = useState(String(restaurant.tallyPort ?? 9000));
  const [tallyUseHttps, setTallyUseHttps] = useState(Boolean(restaurant.tallyUseHttps));
  const [syncEnabled, setSyncEnabled] = useState(Boolean(restaurant.syncEnabled));
  const [syncHqUrl, setSyncHqUrl] = useState(restaurant.syncHqUrl ?? "");
  const [syncHqToken, setSyncHqToken] = useState("");
  const [syncIntervalSec, setSyncIntervalSec] = useState(String(restaurant.syncIntervalSec ?? 60));
  const [ledgers, setLedgers] = useState(
    restaurant.tallyLedgers?.length
      ? restaurant.tallyLedgers.map((row) => ({ sourceKey: row.sourceKey, ledgerName: row.ledgerName }))
      : [{ sourceKey: "", ledgerName: "" }],
  );
  const [payCash, setPayCash] = useState(Boolean(restaurant.payCash));
  const [payCard, setPayCard] = useState(Boolean(restaurant.payCard));
  const [payUpi, setPayUpi] = useState(restaurant.payUpi !== false);
  const [payOther, setPayOther] = useState(Boolean(restaurant.payOther));
  const [receiptWhatsApp, setReceiptWhatsApp] = useState(restaurant.receiptWhatsApp !== false);
  const [receiptEmailEnabled, setReceiptEmailEnabled] = useState(restaurant.receiptEmailEnabled !== false);
  const [receiptPrint, setReceiptPrint] = useState(restaurant.receiptPrint !== false);
  const [employeeDiscountPercent, setEmployeeDiscountPercent] = useState(
    String(restaurant.employeeDiscountPercent ?? 0),
  );
  const [reservationMessage, setReservationMessage] = useState(restaurant.reservationMessage ?? "");
  const [waCloudEnabled, setWaCloudEnabled] = useState(Boolean(restaurant.waCloudEnabled));
  const [waCloudBaseUrl, setWaCloudBaseUrl] = useState(restaurant.waCloudBaseUrl ?? "");
  const [waCloudPhoneNumberId, setWaCloudPhoneNumberId] = useState(restaurant.waCloudPhoneNumberId ?? "");
  const [waCloudAccessToken, setWaCloudAccessToken] = useState("");
  const [waCloudTemplateName, setWaCloudTemplateName] = useState(restaurant.waCloudTemplateName ?? "");
  const [waCloudTemplateLang, setWaCloudTemplateLang] = useState(restaurant.waCloudTemplateLang ?? "");
  const [smsEnabled, setSmsEnabled] = useState(Boolean(restaurant.smsEnabled));
  const [smsProvider, setSmsProvider] = useState(restaurant.smsProvider ?? "");
  const [smsBaseUrl, setSmsBaseUrl] = useState(restaurant.smsBaseUrl ?? "");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsApiSecret, setSmsApiSecret] = useState("");
  const [smsSenderId, setSmsSenderId] = useState(restaurant.smsSenderId ?? "");
  const [smsCountryPrefix, setSmsCountryPrefix] = useState(restaurant.smsCountryPrefix ?? "");
  const [clvHorizonMonths, setClvHorizonMonths] = useState(String(restaurant.clvHorizonMonths ?? 12));
  const [clvMarginPercent, setClvMarginPercent] = useState(String(restaurant.clvMarginPercent ?? 100));
  const [aiEnabled, setAiEnabled] = useState(Boolean(restaurant.aiEnabled));
  const [aiProvider, setAiProvider] = useState(restaurant.aiProvider ?? "");
  const [aiBaseUrl, setAiBaseUrl] = useState(restaurant.aiBaseUrl ?? "");
  const [aiModel, setAiModel] = useState(restaurant.aiModel ?? "");
  const [aiToken, setAiToken] = useState("");
  const [aiHistoryDays, setAiHistoryDays] = useState(String(restaurant.aiHistoryDays ?? 28));
  const [aiHorizonDays, setAiHorizonDays] = useState(String(restaurant.aiHorizonDays ?? 7));
  const [aiLeadTimeDays, setAiLeadTimeDays] = useState(
    restaurant.aiLeadTimeDays == null ? "" : String(restaurant.aiLeadTimeDays),
  );
  const [weatherBaseUrl, setWeatherBaseUrl] = useState(restaurant.weatherBaseUrl ?? "");
  const [weatherApiKey, setWeatherApiKey] = useState("");

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      {
        smtpHost: smtpHost.trim() || null,
        smtpPort: smtpPort ? Number(smtpPort) : null,
        smtpUser: smtpUser.trim() || null,
        smtpFrom: smtpFrom.trim() || null,
        smtpSecure,
        ...(smtpPassword ? { smtpPassword } : {}),
        tallyEnabled,
        tallyCompanyName: tallyCompanyName.trim() || null,
        tallyHost: tallyHost.trim() || null,
        tallyPort: tallyPort ? Number(tallyPort) : null,
        tallyUseHttps,
        syncEnabled,
        syncHqUrl: syncHqUrl.trim() || null,
        syncIntervalSec: Number(syncIntervalSec) || 60,
        ...(syncHqToken ? { syncHqToken } : {}),
        tallyLedgers: ledgers.filter((row) => row.sourceKey.trim() && row.ledgerName.trim()),
        payCash,
        payCard,
        payUpi,
        payOther,
        receiptWhatsApp,
        receiptEmailEnabled,
        receiptPrint,
        employeeDiscountPercent: Number(employeeDiscountPercent) || 0,
        reservationMessage: reservationMessage.trim() || null,
        waCloudEnabled,
        waCloudBaseUrl: waCloudBaseUrl.trim() || null,
        waCloudPhoneNumberId: waCloudPhoneNumberId.trim() || null,
        waCloudTemplateName: waCloudTemplateName.trim() || null,
        waCloudTemplateLang: waCloudTemplateLang.trim() || null,
        ...(waCloudAccessToken ? { waCloudAccessToken } : {}),
        smsEnabled,
        smsProvider:
          smsProvider === "MSG91" || smsProvider === "TWILIO" || smsProvider === "CUSTOM"
            ? smsProvider
            : null,
        smsBaseUrl: smsBaseUrl.trim() || null,
        smsSenderId: smsSenderId.trim() || null,
        smsCountryPrefix: smsCountryPrefix.trim() || null,
        ...(smsApiKey ? { smsApiKey } : {}),
        ...(smsApiSecret ? { smsApiSecret } : {}),
        clvHorizonMonths: Number(clvHorizonMonths) || 12,
        clvMarginPercent: Number(clvMarginPercent) || 0,
        aiEnabled,
        aiProvider:
          aiProvider === "HUGGINGFACE" || aiProvider === "NVIDIA" ? aiProvider : null,
        aiBaseUrl: aiBaseUrl.trim() || null,
        aiModel: aiModel.trim() || null,
        aiHistoryDays: Number(aiHistoryDays) || 28,
        aiHorizonDays: Number(aiHorizonDays) || 7,
        aiLeadTimeDays: aiLeadTimeDays === "" ? null : Number(aiLeadTimeDays),
        weatherBaseUrl: weatherBaseUrl.trim() || null,
        ...(aiToken ? { aiToken } : {}),
        ...(weatherApiKey ? { weatherApiKey } : {}),
      },
      {
        onSuccess: () => {
          setSmtpPassword("");
          setWaCloudAccessToken("");
          setSmsApiKey("");
          setSmsApiSecret("");
          setAiToken("");
          setWeatherApiKey("");
          toast.success("Payments, mail, and Tally saved");
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save"),
      },
    );
  };

  return (
    <Card className="flex flex-col gap-4 p-6">
      <h2 className="text-[18px] font-medium text-foreground">Payments, mail, and Tally</h2>
      <form onSubmit={onSave} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <span className="text-sm">UPI</span>
            <Switch checked={payUpi} onCheckedChange={setPayUpi} aria-label="Enable UPI" />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <span className="text-sm">Cash</span>
            <Switch checked={payCash} onCheckedChange={setPayCash} aria-label="Enable cash" />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <span className="text-sm">Card</span>
            <Switch checked={payCard} onCheckedChange={setPayCard} aria-label="Enable card" />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <span className="text-sm">Other</span>
            <Switch checked={payOther} onCheckedChange={setPayOther} aria-label="Enable other payments" />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <span className="text-sm">WhatsApp receipt</span>
            <Switch checked={receiptWhatsApp} onCheckedChange={setReceiptWhatsApp} aria-label="WhatsApp receipt" />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <span className="text-sm">Email receipt</span>
            <Switch checked={receiptEmailEnabled} onCheckedChange={setReceiptEmailEnabled} aria-label="Email receipt" />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <span className="text-sm">Print receipt</span>
            <Switch checked={receiptPrint} onCheckedChange={setReceiptPrint} aria-label="Print receipt" />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="smtp-host">SMTP host</Label>
            <Input id="smtp-host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} autoComplete="off" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="smtp-port">SMTP port</Label>
            <Input id="smtp-port" type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="smtp-user">SMTP user</Label>
            <Input id="smtp-user" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} autoComplete="off" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="smtp-pass">SMTP password</Label>
            <Input
              id="smtp-pass"
              type="password"
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              placeholder={restaurant.smtpConfigured ? "Saved. Type to replace." : "App password"}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="smtp-from">From address</Label>
            <Input id="smtp-from" type="email" value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} />
          </div>
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <span className="text-sm">SMTP TLS (port 465)</span>
            <Switch checked={smtpSecure} onCheckedChange={setSmtpSecure} aria-label="SMTP secure" />
          </label>
        </div>

        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <span className="text-sm">Tally export</span>
          <Switch checked={tallyEnabled} onCheckedChange={setTallyEnabled} aria-label="Tally export" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tally-company">Tally company name</Label>
            <Input id="tally-company" value={tallyCompanyName} onChange={(e) => setTallyCompanyName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tally-host">Tally XML Server host</Label>
            <Input id="tally-host" value={tallyHost} onChange={(e) => setTallyHost(e.target.value)} placeholder="192.168.1.20" autoComplete="off" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tally-port">Tally port</Label>
            <Input id="tally-port" type="number" value={tallyPort} onChange={(e) => setTallyPort(e.target.value)} />
          </div>
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <span className="text-sm">Tally HTTPS</span>
            <Switch checked={tallyUseHttps} onCheckedChange={setTallyUseHttps} aria-label="Tally HTTPS" />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Enable HTTP Server in Tally (Help → Settings → Advanced Configuration). Default port is 9000. From Docker on the same PC use host.docker.internal.
        </p>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <span className="text-sm">Branch sync agent</span>
          <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} aria-label="Branch sync agent" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sync-hq">HQ URL (empty = store on this server)</Label>
            <Input id="sync-hq" value={syncHqUrl} onChange={(e) => setSyncHqUrl(e.target.value)} placeholder="https://hq.example.com" autoComplete="off" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sync-token">HQ token</Label>
            <Input
              id="sync-token"
              type="password"
              value={syncHqToken}
              onChange={(e) => setSyncHqToken(e.target.value)}
              placeholder={restaurant.syncHqTokenConfigured ? "Saved. Type to replace." : "Shared secret"}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sync-interval">Sync every (seconds)</Label>
            <Input id="sync-interval" type="number" value={syncIntervalSec} onChange={(e) => setSyncIntervalSec(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Tally ledgers</Label>
          <p className="text-xs text-muted-foreground">
            Map a payment method key such as UPI to the ledger name Tally should use.
          </p>
          {ledgers.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input
                value={row.sourceKey}
                onChange={(e) =>
                  setLedgers((rows) =>
                    rows.map((item, i) => (i === index ? { ...item, sourceKey: e.target.value } : item)),
                  )
                }
                placeholder="Source key"
                aria-label={`Ledger source ${index + 1}`}
              />
              <Input
                value={row.ledgerName}
                onChange={(e) =>
                  setLedgers((rows) =>
                    rows.map((item, i) => (i === index ? { ...item, ledgerName: e.target.value } : item)),
                  )
                }
                placeholder="Ledger name"
                aria-label={`Ledger name ${index + 1}`}
              />
              <Button type="button" variant="outline" onClick={() => setLedgers((rows) => rows.filter((_, i) => i !== index))}>
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setLedgers((rows) => [...rows, { sourceKey: "", ledgerName: "" }])}
          >
            Add ledger
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="employee-discount">Employee discount %</Label>
          <Input
            id="employee-discount"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={employeeDiscountPercent}
            onChange={(e) => setEmployeeDiscountPercent(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reservation-message">Reservation notice</Label>
          <Textarea
            id="reservation-message"
            value={reservationMessage}
            onChange={(e) => setReservationMessage(e.target.value)}
            rows={3}
            placeholder="Use {name} {when} {guests} {restaurant} {deposit} {phone}"
          />
        </div>

        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <span className="text-sm">WhatsApp Cloud API</span>
          <Switch checked={waCloudEnabled} onCheckedChange={setWaCloudEnabled} aria-label="WhatsApp Cloud API" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="wa-base">WhatsApp Cloud API URL</Label>
            <Input
              id="wa-base"
              value={waCloudBaseUrl}
              onChange={(e) => setWaCloudBaseUrl(e.target.value)}
              placeholder="https://graph.facebook.com/v21.0"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="wa-phone-id">Phone number id</Label>
            <Input
              id="wa-phone-id"
              value={waCloudPhoneNumberId}
              onChange={(e) => setWaCloudPhoneNumberId(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="wa-token">Access token</Label>
            <Input
              id="wa-token"
              type="password"
              value={waCloudAccessToken}
              onChange={(e) => setWaCloudAccessToken(e.target.value)}
              placeholder={restaurant.waCloudTokenConfigured ? "Saved. Type to replace." : "Permanent token"}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="wa-template">Template name (optional)</Label>
            <Input
              id="wa-template"
              value={waCloudTemplateName}
              onChange={(e) => setWaCloudTemplateName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="wa-lang">Template language</Label>
            <Input
              id="wa-lang"
              value={waCloudTemplateLang}
              onChange={(e) => setWaCloudTemplateLang(e.target.value)}
              placeholder="en"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Sends POST to the stored URL plus the phone-number id and /messages, with a Bearer token.
          Leave the template name empty to send a session text message.
        </p>

        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <span className="text-sm">SMS gateway</span>
          <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} aria-label="SMS gateway" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sms-provider">Provider</Label>
            <select
              id="sms-provider"
              aria-label="SMS provider"
              value={smsProvider}
              onChange={(e) => setSmsProvider(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">Choose</option>
              <option value="MSG91">MSG91</option>
              <option value="TWILIO">Twilio</option>
              <option value="CUSTOM">Custom HTTP</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sms-base">SMS API URL</Label>
            <Input
              id="sms-base"
              value={smsBaseUrl}
              onChange={(e) => setSmsBaseUrl(e.target.value)}
              placeholder="Full send URL from the provider"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sms-key">API key / Account SID</Label>
            <Input
              id="sms-key"
              type="password"
              value={smsApiKey}
              onChange={(e) => setSmsApiKey(e.target.value)}
              placeholder={restaurant.smsApiKeyConfigured ? "Saved. Type to replace." : "Key"}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sms-secret">API secret / Auth token</Label>
            <Input
              id="sms-secret"
              type="password"
              value={smsApiSecret}
              onChange={(e) => setSmsApiSecret(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sms-sender">Sender id / From number</Label>
            <Input id="sms-sender" value={smsSenderId} onChange={(e) => setSmsSenderId(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sms-prefix">Country prefix</Label>
            <Input
              id="sms-prefix"
              value={smsCountryPrefix}
              onChange={(e) => setSmsCountryPrefix(e.target.value)}
              placeholder="91"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="clv-horizon">CLV horizon (months)</Label>
            <Input
              id="clv-horizon"
              type="number"
              min="1"
              max="120"
              value={clvHorizonMonths}
              onChange={(e) => setClvHorizonMonths(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="clv-margin">CLV margin %</Label>
            <Input
              id="clv-margin"
              type="number"
              min="0"
              max="100"
              value={clvMarginPercent}
              onChange={(e) => setClvMarginPercent(e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <span className="text-sm">Demand forecast model</span>
          <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} aria-label="Demand forecast model" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ai-provider">Provider</Label>
            <select
              id="ai-provider"
              aria-label="AI provider"
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">Choose</option>
              <option value="HUGGINGFACE">Hugging Face</option>
              <option value="NVIDIA">NVIDIA NIM</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ai-url">Chat completions URL</Label>
            <Input
              id="ai-url"
              value={aiBaseUrl}
              onChange={(e) => setAiBaseUrl(e.target.value)}
              placeholder="https://router.huggingface.co/v1"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ai-model">Model id</Label>
            <Input
              id="ai-model"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              placeholder="The id from Hugging Face or build.nvidia.com"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ai-token">API token</Label>
            <Input
              id="ai-token"
              type="password"
              value={aiToken}
              onChange={(e) => setAiToken(e.target.value)}
              placeholder={restaurant.aiTokenConfigured ? "Saved. Type to replace." : "hf_ or nvapi- token"}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ai-history">History days</Label>
            <Input
              id="ai-history"
              type="number"
              min="7"
              max="365"
              value={aiHistoryDays}
              onChange={(e) => setAiHistoryDays(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ai-horizon">Forecast horizon days</Label>
            <Input
              id="ai-horizon"
              type="number"
              min="1"
              max="60"
              value={aiHorizonDays}
              onChange={(e) => setAiHorizonDays(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ai-lead">Fallback lead time days</Label>
            <Input
              id="ai-lead"
              type="number"
              min="0"
              max="90"
              value={aiLeadTimeDays}
              onChange={(e) => setAiLeadTimeDays(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="weather-url">Weather URL (optional)</Label>
            <Input
              id="weather-url"
              value={weatherBaseUrl}
              onChange={(e) => setWeatherBaseUrl(e.target.value)}
              placeholder="Full forecast URL you already have"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="weather-key">Weather API key (optional)</Label>
            <Input
              id="weather-key"
              type="password"
              value={weatherApiKey}
              onChange={(e) => setWeatherApiKey(e.target.value)}
              placeholder={restaurant.weatherApiKeyConfigured ? "Saved. Type to replace." : "Sent as Bearer"}
              autoComplete="new-password"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Hugging Face: token from huggingface.co/settings/tokens, URL like
          https://router.huggingface.co/v1, model id from the model card. NVIDIA: key from
          build.nvidia.com, URL https://integrate.api.nvidia.com/v1. Empty URL or token means
          Inventory → Forecast stays on local weekday velocity. Weather is skipped unless you
          store a URL.
        </p>

        <Button type="submit" disabled={update.isPending} className="self-start">
          {update.isPending ? "Saving…" : "Save payments and mail"}
        </Button>
      </form>
    </Card>
  );
}
