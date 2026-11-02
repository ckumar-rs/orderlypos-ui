import { siteUrl } from "@/lib/seo";

export function GET() {
  const origin = siteUrl();
  const body = `# OrderlyPOS

> OrderlyPOS is the restaurant system from Contrivya for the till, the kitchen, the floor, and the guest. A guest orders from a table QR, a kiosk, or a WhatsApp catalog. Ask reads that service and does not take a payment. The owner chooses whether agents draft a change or send it. Plans start at ₹2,999 a month. Creating an account does not charge a card.

OrderlyPOS is for a cafe or food truck, a dining room, a kiosk, or a group of branches.

## Product

- [Home](${origin}/orderlyPOS): What the floor does during service and what is checked after close.
- [Features](${origin}/orderlyPOS/features): Screens from this install, and what each one is for.
- [Agent](${origin}/orderlyPOS/agent): Ask reads the open branch. Settings chooses whether a message waits for a person or goes out on its own.
- [How to use](${origin}/orderlyPOS/how-to-use): From the first table to the cash close.
- [Pricing](${origin}/orderlyPOS/pricing): Starter ₹2,999 or $36, Growth ₹4,999 or $60, Pro ₹6,999 or $84, Enterprise ₹12,999 or $156 a month. Switch INR or USD. Yearly billing is 20% less.
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
