const lines = [
  { from: "Staff", text: "Late kitchen tickets" },
  { from: "Ask", text: "Reads the open tickets on this branch" },
  { from: "Books", text: "Ticket, station, and how long it has waited" },
  { from: "Ask", text: "The reply uses only those figures" },
  { from: "Owner", text: "Every five minutes, a paid bill, low stock, or today’s book can notify" },
];

/** The path a question takes. The words are the product, not a live answer. */
export function AgentTalk({ embedded = false }: { embedded?: boolean }) {
  return (
    <figure className={embedded ? "" : "mt-10 border-y border-border py-8"}>
      <figcaption className="text-sm font-medium">How the agent communicates</figcaption>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Staff ask. Ask reads the same books the till writes. A rule can still speak to the owner when the screen is empty.
      </p>
      <div className="relative mt-6 max-w-xl pl-6">
        <span aria-hidden className="absolute top-2 bottom-2 left-[5px] w-px bg-border" />
        <span aria-hidden className="agent-bead absolute left-0 size-2.5 rounded-full bg-primary" />
        <ol>
          {lines.map((line) => (
            <li key={line.text} className="agent-line py-2">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">{line.from}</p>
              <p className="mt-0.5 text-sm">{line.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
