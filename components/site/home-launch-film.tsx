"use client";

import { SiteReveal } from "@/components/site/site-motion";

/** Product launch film from /brag — real till, kitchen, and guest screens. */
export function HomeLaunchFilm() {
  return (
    <section className="border-y border-border" aria-labelledby="home-launch-film-title">
      <SiteReveal className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <p className="text-sm font-medium text-primary">Launch film</p>
        <h2
          id="home-launch-film-title"
          className="mt-3 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-4xl"
        >
          OrderlyPOS in twenty-four seconds.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Till, kitchen, guest menu, and Ask — developed by Contrivya.
        </p>
        <div className="mt-10 overflow-hidden rounded-xl border border-border bg-[#0b1220] shadow-[0_28px_70px_-36px_rgba(17,24,39,0.55)]">
          <video
            className="aspect-video w-full"
            controls
            playsInline
            preload="metadata"
            poster="/site/orderlypos-launch.jpg"
            aria-label="OrderlyPOS product launch film"
          >
            <source src="/site/orderlypos-launch.mp4" type="video/mp4" />
          </video>
        </div>
      </SiteReveal>
    </section>
  );
}
