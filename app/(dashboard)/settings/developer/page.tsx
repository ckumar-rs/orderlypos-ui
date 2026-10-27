"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError, api } from "@/lib/api";

const ENDPOINTS = [
  ["Open orders for a table", "GET /api/v1/service/sessions?branchId="],
  ["Repeat selected dishes", "POST /api/v1/orders/repeat-items?branchId="],
  ["Move a line", "POST /api/v1/orders/:id/move-item?branchId="],
  ["GraphQL", "POST /api/v1/platform/graphql"],
  ["Guest bill", "GET /api/v1/public/menu/:token/orders/:orderNumber"],
  ["API catalog", "GET /api/docs"],
];

export default function DeveloperPage() {
  const [query, setQuery] = useState("{ scoreboard { name orders sales aov covers noShows } }");
  const [result, setResult] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <SettingsTabs />
      <div>
        <h1 className="text-lg font-semibold">Developer</h1>
        <p className="text-sm text-muted-foreground">Staff routes use the signed-in session. GraphQL reads the menu, open orders, a customer, the franchise scoreboard, and devices, and can recall a kitchen ticket.</p>
      </div>
      <Card className="flex flex-col gap-3 p-4">
        <textarea
          className="min-h-28 rounded-md border border-input bg-background p-2 font-mono text-sm"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button
          type="button"
          onClick={() =>
            api
              .post<{ data: unknown; errors: string[] }>("/platform/graphql", { query })
              .then((row) => setResult(JSON.stringify(row, null, 2)))
              .catch((error) => toast.error(error instanceof ApiError ? error.message : "Query failed"))
          }
        >
          Run query
        </Button>
        {result ? <pre className="overflow-auto text-xs">{result}</pre> : null}
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {ENDPOINTS.map(([title, path]) => (
          <Card key={path} className="p-4">
            <p className="font-medium">{title}</p>
            <p className="font-mono text-sm">{path}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
