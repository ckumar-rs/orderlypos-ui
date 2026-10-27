import Image from "next/image";

/** The captured screen, in a window. The picture is the product, not a phone mock. */
export function ProductFrame({
  src,
  alt,
  priority = false,
  crop = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  crop?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex h-9 items-center gap-1.5 border-b border-border px-3">
        <span aria-hidden className="size-1.5 rounded-full bg-border" />
        <span aria-hidden className="size-1.5 rounded-full bg-border" />
        <span aria-hidden className="size-1.5 rounded-full bg-border" />
        <span className="ml-2 truncate text-xs text-muted-foreground">This restaurant</span>
      </div>
      <div className={crop ? "relative max-h-[28rem] overflow-hidden" : undefined}>
        <Image
          src={src}
          alt={alt}
          width={780}
          height={1400}
          priority={priority}
          className="h-auto w-full"
        />
        {crop ? (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
        ) : null}
      </div>
    </div>
  );
}
