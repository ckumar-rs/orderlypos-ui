"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChefHat, MessageCircle, Smartphone } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { HeroAtmosphere, HeroProductVisual } from "@/components/site/hero-atmosphere";
import { HeroLogo } from "@/components/site/hero-logo";
import { ReachUs } from "@/components/site/reach-us";
import { HeroIntro, HeroIntroItem } from "@/components/site/site-motion";

const points = [
  {
    title: "Till, kitchen, and floor",
    body: "One sign-in for service. Guests order from QR, kiosk, or WhatsApp.",
    icon: ChefHat,
  },
  {
    title: "Ask reads the books",
    body: "Staff ask about sales and tickets. Ask does not take a payment.",
    icon: MessageCircle,
  },
  {
    title: "Any staff device",
    body: "Phone, tablet, kiosk, or till. The books stay on the restaurant host.",
    icon: Smartphone,
  },
];

/** Marketing-matched auth layout: brand panel + form. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex min-h-full flex-1 bg-background text-foreground">
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-border lg:flex">
        <HeroAtmosphere />
        <div className="relative z-10 flex flex-1 flex-col justify-between px-10 py-10 xl:px-14">
          <HeroIntro className="gap-0">
            <HeroIntroItem>
              <Link href="/orderlyPOS" aria-label="OrderlyPOS home">
                <HeroLogo size={44} />
              </Link>
            </HeroIntroItem>
            <HeroIntroItem>
              <p className="mt-10 text-sm font-semibold tracking-[0.14em] text-primary uppercase">
                OrderlyPOS
              </p>
              <h2 className="mt-3 max-w-md text-3xl font-medium tracking-tight text-balance xl:text-[2.35rem] xl:leading-[1.1]">
                Open for service. Still checking after close.
              </h2>
            </HeroIntroItem>
            <HeroIntroItem>
              <ul className="mt-10 max-w-md border-t border-border">
                {points.map((point) => {
                  const Icon = point.icon;
                  return (
                    <li key={point.title} className="flex gap-3 border-b border-border py-5">
                      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <div>
                        <p className="text-sm font-medium">{point.title}</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {point.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </HeroIntroItem>
          </HeroIntro>

          <div className="relative mt-10">
            <div className="mx-auto max-w-[17rem]">
              <HeroProductVisual
                primarySrc="/site/admin-pos.png"
                secondarySrc="/site/admin-kds.png"
                alt="OrderlyPOS till and kitchen"
                className="max-w-none"
                compact
              />
            </div>
            <div className="mt-8">
              <p className="text-sm text-muted-foreground">
                Plans from ₹2,999 a month.{" "}
                <Link
                  href="/orderlyPOS/pricing"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  See plans
                </Link>
              </p>
              <ReachUs className="mt-4" />
            </div>
          </div>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col">
        <HeroAtmosphere className="opacity-70 lg:opacity-40" />
        <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8 lg:justify-end">
          <Link href="/orderlyPOS" className="lg:hidden" aria-label="OrderlyPOS home">
            <HeroLogo size={32} />
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/orderlyPOS" className="hidden text-muted-foreground hover:text-foreground sm:inline">
              Product
            </Link>
            <Link href="/orderlyPOS/pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </nav>
        </header>

        <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
            <div className="mb-8">
              <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            </div>
            {children}
            {footer ? <div className="mt-8">{footer}</div> : null}
          </motion.div>
        </div>

        <footer className="relative z-10 border-t border-border px-5 py-4 text-center text-xs text-muted-foreground sm:px-8 sm:text-left">
          OrderlyPOS by Contrivya.{" "}
          <Link href="/orderlyPOS/terms" className="underline-offset-4 hover:underline">
            Terms
          </Link>
          {" · "}
          <Link href="/orderlyPOS/privacy" className="underline-offset-4 hover:underline">
            Privacy
          </Link>
        </footer>
      </main>
    </div>
  );
}
