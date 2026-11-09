import Link from "next/link";

/** Shopify “all-in-one” contrast — scattered tools vs one system. */
const rows = [
  {
    before: "Separate till, kitchen screen, and spreadsheet",
    after: "One sign-in for till, kitchen, floor, and books",
  },
  {
    before: "Guest QR or WhatsApp that never reaches the pass",
    after: "Table QR, kiosk, and WhatsApp write the same tickets",
  },
  {
    before: "Owner checks sales only when someone is signed in",
    after: "Ask reads the branch; rules can notify every five minutes",
  },
  {
    before: "Tally or a gateway that always calls out",
    after: "Connectors stay off until Settings stores that host",
  },
];

export function HomeCompare() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20" aria-labelledby="home-compare-title" id="compare">
      <p className="text-sm font-medium text-primary">Instead of five apps</p>
      <h2
        id="home-compare-title"
        className="mt-3 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-4xl"
      >
        Replace the patchwork.
      </h2>
      <div className="mt-10 overflow-x-auto border-t border-border">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-4 pr-6 font-medium text-muted-foreground">
                Scattered tools
              </th>
              <th scope="col" className="py-4 font-medium text-foreground">
                OrderlyPOS
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.after} className="border-b border-border align-top">
                <td className="py-4 pr-6 text-muted-foreground">{row.before}</td>
                <td className="py-4 font-medium text-foreground">{row.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link
        href="/signup"
        className="mt-8 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Try now OrderlyPOS
      </Link>
    </section>
  );
}
