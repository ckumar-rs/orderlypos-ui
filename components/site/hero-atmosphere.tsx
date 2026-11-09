"use client";

import { motion, useReducedMotion } from "motion/react";
import { ProductFrame } from "@/components/site/product-frame";
import { cn } from "@/lib/utils";

/** Soft wash behind copy — never competes with the product frames. */
export function HeroAtmosphere({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_10%,#FFF1E6_0%,transparent_42%),radial-gradient(ellipse_at_88%_20%,#F6F3F0_0%,transparent_38%),linear-gradient(180deg,#FBF9F8_0%,#FBF9F8_55%,#F6F3F0_100%)]"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      {!reducedMotion ? (
        <>
          <motion.div
            className="absolute left-[-10%] top-[18%] h-[28rem] w-[28rem] rounded-full bg-primary/12 blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, 16, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[-8%] top-[30%] h-[32rem] w-[32rem] rounded-full bg-[#FFB48A]/25 blur-3xl"
            animate={{ x: [0, -22, 0], y: [0, -18, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[8%] top-[42%] h-[18rem] w-[18rem] rounded-full bg-primary/20 blur-3xl"
            animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

/**
 * Stacked product frames for auth / marketing panels.
 * Deploy UI omits the Three.js scene so the build stays light.
 */
export function HeroProductVisual({
  primarySrc = "/site/admin-pos.png",
  secondarySrc = "/site/admin-kds.png",
  alt = "OrderlyPOS till and kitchen pass",
  className,
  compact = false,
}: {
  primarySrc?: string;
  secondarySrc?: string;
  alt?: string;
  className?: string;
  compact?: boolean;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={cn("relative mx-auto w-full max-w-xl", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl"
      />
      <motion.div
        className="relative"
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className={cn(
            "absolute opacity-70",
            compact ? "-left-1 top-3 w-[68%] -rotate-5" : "-left-2 top-6 w-[72%] -rotate-6 sm:-left-6",
          )}
        >
          <ProductFrame src={secondarySrc} alt="" crop />
        </div>
        <div className={cn("relative ml-auto", compact ? "w-[82%]" : "w-[84%]")}>
          <ProductFrame src={primarySrc} alt={alt} priority={!compact} crop />
        </div>
      </motion.div>
    </div>
  );
}
