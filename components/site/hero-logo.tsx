import { Logo } from "@/components/layout/logo";

/** Turns the existing OrderlyPOS lockup in perspective. Does not redraw the mark. */
export function HeroLogo({ size = 72 }: { size?: number }) {
  return (
    <div className="mx-auto w-fit [perspective:900px]" aria-hidden>
      <div className="hero-logo-yaw">
        <Logo size={size} />
      </div>
      <div className="hero-logo-shadow mx-auto mt-3 h-2 w-40 rounded-full bg-foreground/40 blur-sm" />
    </div>
  );
}
