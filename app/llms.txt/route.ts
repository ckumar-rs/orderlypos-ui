import { siteUrl } from "@/lib/seo";

export function GET() {
  const origin = siteUrl();
  const body = `# OrderlyPOS

> Agentic restaurant POS from Contrivya. The till, the kitchen, the tables, and the guest kiosk run on a computer in the restaurant. Ask reads that service and does not take a payment. Plans start at ₹499 a month. Creating an account does not charge a card.

OrderlyPOS is for a cafe or food truck, a dining room, a kiosk, or a group of branches.

## Product

- [Home](${origin}/orderlyPOS): What the floor does during service and what is checked after close.
- [Features](${origin}/orderlyPOS/features): Screens from this install, and what each one is for.
- [Agent](${origin}/orderlyPOS/agent): Ask reads the open branch. A rule can notify the owner every five minutes.
- [How to use](${origin}/orderlyPOS/how-to-use): From the first table to the cash close.
- [Pricing](${origin}/orderlyPOS/pricing): Starter ₹499, Growth ₹999, Pro ₹2,499 a month. Yearly billing is 20% less. Enterprise is a quote.
- [Try now](${origin}/signup): Create an account. A paid plan starts when Contrivya confirms it by email.

## Company

- [About](${origin}/orderlyPOS/about): OrderlyPOS is made by Contrivya.
- [Contact](${origin}/contact): WhatsApp and phone +91-9346342691, email info@contrivya.com.
- [Contrivya](https://www.contrivya.com): The company site.

## Docs

- [Guides](${origin}/orderlyPOS/docs): How to use, features, the agent, the API, accessibility, and India notes.
- [API and MCP](${origin}/docs/api): A scoped key for a website, and the same permissions the screen uses.
- [Terms](${origin}/orderlyPOS/terms): The agreement for the public site and a plan.
- [Privacy](${origin}/orderlyPOS/privacy): What this site stores, and what stays on the restaurant computer.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
