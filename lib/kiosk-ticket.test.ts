import assert from "node:assert/strict";
import { test } from "node:test";
import { buildTicketHtml, escapeHtml, type TicketData } from "./kiosk-ticket.ts";

const base: TicketData = {
  restaurantName: "Bar <Demo> & Co",
  orderNumber: "20261017-0007",
  createdAt: "2026-10-17T10:30:00Z",
  serviceLabel: "Para llevar",
  items: [{ name: 'Café "solo"', quantity: 2, lineTotal: "3.5" }],
  subtotal: "3.5",
  taxAmount: "0.32",
  totalAmount: "3.5",
  taxLabel: "IVA",
  taxMode: "INCLUSIVE",
  locale: "es-ES",
  currency: "EUR",
  paid: false,
  labels: {
    order: "Pedido",
    total: "Total",
    taxIncluded: "Incluye",
    paid: "RECIBO PAGADO",
    notPaid: "RECIBO NO PAGADO",
    payAtCounter: "Pague en caja",
  },
};

test("escapes HTML in restaurant and item names", () => {
  const html = buildTicketHtml(base);
  assert.ok(html.includes("Bar &lt;Demo&gt; &amp; Co"));
  assert.ok(html.includes("Café &quot;solo&quot;"));
  assert.ok(!html.includes("<Demo>"));
  assert.equal(escapeHtml("<script>"), "&lt;script&gt;");
});

test("is laid out for 80 mm paper and formats money for the locale/currency", () => {
  const html = buildTicketHtml(base);
  assert.ok(html.includes("size: 80mm auto"));
  assert.ok(html.includes("width: 80mm"));
  assert.match(html, /3,50\s€/);
  assert.ok(html.includes("Incluye IVA"));
});

test("marks an unpaid ticket as a not-paid receipt and omits a zero tax row", () => {
  const html = buildTicketHtml({ ...base, taxAmount: "0" });
  assert.ok(html.includes("RECIBO NO PAGADO"));
  assert.ok(html.includes("Pague en caja"));
  assert.ok(!html.includes("RECIBO PAGADO"));
  assert.ok(!html.includes("Incluye IVA"));
});

test("marks a paid ticket as a paid receipt", () => {
  const html = buildTicketHtml({
    ...base,
    paid: true,
    labels: { ...base.labels, payAtCounter: "" },
  });
  assert.ok(html.includes("RECIBO PAGADO"));
  assert.ok(!html.includes("RECIBO NO PAGADO"));
  assert.ok(!html.includes("Pague en caja"));
});
