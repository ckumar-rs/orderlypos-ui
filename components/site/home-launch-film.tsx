"use client";

import { SiteReveal } from "@/components/site/site-motion";

/** Product film — real till, kitchen, and guest screens. */
export function HomeLaunchFilm() {
  return (
    <section className="border-y border-border" aria-label="OrderlyPOS product film">
      <SiteReveal className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="overflow-hidden rounded-xl border border-border bg-[#0b1220] shadow-[0_28px_70px_-36px_rgba(17,24,39,0.55)]">
          <video
            className="aspect-video w-full"
            controls
            playsInline
            preload="metadata"
            poster="/site/orderlypos-launch.jpg"
            aria-label="OrderlyPOS product film"
          >
            <source src="/site/orderlypos-launch.mp4" type="video/mp4" />
          </video>
        </div>
      </SiteReveal>
    </section>
  );
}
