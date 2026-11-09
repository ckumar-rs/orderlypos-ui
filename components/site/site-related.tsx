import Link from "next/link";

export type SiteRelatedItem = {
  href: string;
  title: string;
  body: string;
};

/** Shopify “keep exploring” related links — same chrome on every page. */
export function SiteRelated({
  title = "Keep going",
  items,
}: {
  title?: string;
  items: SiteRelatedItem[];
}) {
  return (
    <section className="border-t border-border" aria-label={title}>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
        <h2 className="text-lg font-medium">{title}</h2>
        <ul className="mt-6 grid border-t border-border sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.href}
              className="border-b border-border py-6 sm:border-r sm:px-6 lg:border-b-0 lg:last:border-r-0"
            >
              <h3 className="text-sm font-medium">
                <Link href={item.href} className="underline-offset-4 hover:underline">
                  {item.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
