"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  HeroIntro,
  HeroIntroItem,
  MotionPress,
} from "@/components/site/site-motion";

type Action = { href: string; label: string; primary?: boolean };

/** Shared Shopify-style page hero for every public OrderlyPOS page. */
export function SitePageHero({
  eyebrow,
  title,
  body,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  actions?: Action[];
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-14 pb-8 sm:px-6 sm:pt-20">
      <HeroIntro>
        <HeroIntroItem>
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
        </HeroIntroItem>
        <HeroIntroItem>
          <h1 className="mt-3 max-w-3xl text-4xl font-medium tracking-tight text-balance sm:text-5xl">
            {title}
          </h1>
        </HeroIntroItem>
        {body ? (
          <HeroIntroItem>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{body}</p>
          </HeroIntroItem>
        ) : null}
        {actions && actions.length > 0 ? (
          <HeroIntroItem>
            <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-3">
              {actions.map((action) => (
                <MotionPress key={action.href + action.label}>
                  <Link
                    href={action.href}
                    className={
                      action.primary
                        ? "inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                        : "inline-flex h-10 items-center px-4 text-sm font-medium underline-offset-4 hover:underline"
                    }
                  >
                    {action.label}
                  </Link>
                </MotionPress>
              ))}
            </div>
          </HeroIntroItem>
        ) : null}
        {children ? <HeroIntroItem>{children}</HeroIntroItem> : null}
      </HeroIntro>
    </section>
  );
}
