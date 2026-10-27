import type { CapturedScreen } from "@/components/site/screens";
import { ProductFrame } from "@/components/site/product-frame";

export function ScreenTour({ screens }: { screens: CapturedScreen[] }) {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-6">
      {screens.map((screen) => (
        <article
          key={screen.src}
          className="grid items-center gap-8 border-t border-border py-16 lg:grid-cols-2 lg:gap-16"
        >
          <div>
            <h2 className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">{screen.title}</h2>
            <p className="mt-3 max-w-prose text-base leading-relaxed text-muted-foreground">
              {screen.body}
            </p>
          </div>
          <div className="mx-auto w-full max-w-md">
            <ProductFrame src={screen.src} alt={screen.title} />
          </div>
        </article>
      ))}
    </div>
  );
}
