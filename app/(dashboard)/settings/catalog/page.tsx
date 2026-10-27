"use client";

import Link from "next/link";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Card } from "@/components/ui/card";

const CONNECTORS = [
  { href: "/settings/payments", name: "Payment gateways", detail: "Razorpay, PhonePe, Paytm, and Stripe stay off until a URL and secret are stored." },
  { href: "/settings/terminals", name: "Card terminals", detail: "Pine Labs, Mosambee, Mswipe, and PAX stay off until a URL and secret are stored." },
  { href: "/settings/food-platforms", name: "Food platforms", detail: "Zomato and Swiggy stay off until a URL and key are stored." },
  { href: "/settings/fleet", name: "Delivery fleets", detail: "Rapido, Dunzo, and Shadowfax stay off until a URL and key are stored." },
  { href: "/settings/house", name: "House accounts", detail: "Advances and charges for a guest account." },
  { href: "/settings/webhooks", name: "Webhooks", detail: "Signed events with retries." },
  { href: "/settings/apps", name: "Installed apps", detail: "An enabled app with a URL and secret receives the same events." },
  { href: "/settings", name: "Tally and weather", detail: "A Tally post and weather rules stay off until Operations stores a host or a URL." },
];

export default function ConnectorCatalogPage() {
  return (
    <div className="flex flex-col gap-4">
      <SettingsTabs />
      <div>
        <h1 className="text-lg font-semibold">Connector catalog</h1>
        <p className="text-sm text-muted-foreground">
          These are the connectors in this product. Open one to store its address and secret. An empty setting is not called. There is no store of outside apps.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {CONNECTORS.map((row) => (
          <Card key={row.href} className="flex flex-col gap-2 p-4">
            <p className="font-medium">{row.name}</p>
            <p className="text-sm text-muted-foreground">{row.detail}</p>
            <Link href={row.href} className="text-sm font-medium text-primary">
              Open settings
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
