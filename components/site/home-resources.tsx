import Link from "next/link";

/** Shopify education / resources strip. */
const resources = [
  {
    title: "Docs",
    body: "API, accessibility, India receipts, and how connectors turn on.",
    href: "/orderlyPOS/docs",
  },
  {
    title: "How to use",
    body: "Sign in, seat, ring, cook, pay, and close — one service path.",
    href: "/orderlyPOS/how-to-use",
  },
  {
    title: "Agentic",
    body: "Ask reads the books. Rules keep checking after close.",
    href: "/orderlyPOS/agent",
  },
  {
    title: "Blog",
    body: "Notes from the build — what shipped and why.",
    href: "/orderlyPOS/blog",
  },
];

export function HomeResources() {
  return (
    <section className="border-y border-border" aria-labelledby="home-resources-title" id="resources">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <p className="text-sm font-medium text-primary">Resources</p>
        <h2
          id="home-resources-title"
          className="mt-3 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-4xl"
        >
          Learn before you open the till.
        </h2>
        <ul className="mt-10 grid border-t border-border sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((item) => (
            <li
              key={item.href}
              className="border-b border-border py-6 sm:border-r sm:px-6 lg:border-b-0 lg:last:border-r-0"
            >
              <h3 className="text-sm font-medium">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              <Link
                href={item.href}
                className="mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
              >
                Open {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
