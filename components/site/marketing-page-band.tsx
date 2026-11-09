"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, Mail, MessageCircle, Phone, Smartphone } from "lucide-react";
import { HeroAtmosphere } from "@/components/site/hero-atmosphere";
import {
  emailAddress,
  phoneHref,
  WhatsAppIcon,
  whatsappHref,
  whatsappNumber,
} from "@/components/site/reach-us";
import { FEATURE_COUNTS } from "@/components/site/screens";
import { SiteReveal, SiteRevealGroup, SiteRevealItem } from "@/components/site/site-motion";
import { cn } from "@/lib/utils";

/** Soft marketing wash behind a page hero / first band. */
export function MarketingHeroBand({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative isolate overflow-hidden", className)}>
      <HeroAtmosphere />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

export function FeatureCountStrip({ className }: { className?: string }) {
  const items = [
    { n: `${FEATURE_COUNTS.modules}`, label: "Core modules" },
    { n: `${FEATURE_COUNTS.screens}+`, label: "Staff screens" },
    { n: `${FEATURE_COUNTS.settings}`, label: "Settings areas" },
    { n: `${FEATURE_COUNTS.guestChannels}`, label: "Order channels" },
  ];
  return (
    <section className={cn("border-y border-border", className)} aria-label="Feature counts">
      <SiteRevealGroup className="mx-auto grid max-w-6xl sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <SiteRevealItem
            key={item.label}
            className="border-b border-border px-5 py-8 sm:border-r sm:px-6 lg:border-b-0 lg:last:border-r-0"
          >
            <p className="text-3xl font-medium tracking-tight tabular-nums text-primary">{item.n}</p>
            <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
          </SiteRevealItem>
        ))}
      </SiteRevealGroup>
    </section>
  );
}

export function AnimatedSteps({
  items,
  markKey = "mark",
}: {
  items: { title: string; body: string; mark?: string }[];
  markKey?: "mark" | "index";
}) {
  return (
    <SiteRevealGroup className="border-t border-border">
      {items.map((item, index) => (
        <SiteRevealItem
          key={item.title}
          className="grid gap-2 border-b border-border py-6 sm:grid-cols-[7rem_1fr] sm:gap-8"
        >
          <p className="text-sm font-medium tabular-nums text-primary">
            {markKey === "mark" && item.mark
              ? item.mark
              : String(index + 1).padStart(2, "0")}
          </p>
          <div>
            <h2 className="text-lg font-medium tracking-tight sm:text-xl">{item.title}</h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </div>
        </SiteRevealItem>
      ))}
    </SiteRevealGroup>
  );
}

export function AnimatedPosts({
  posts,
}: {
  posts: { date: string; title: string; body: string }[];
}) {
  return (
    <SiteRevealGroup className="flex flex-col border-t border-border">
      {posts.map((post) => (
        <SiteRevealItem key={post.title} className="border-b border-border py-8">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {post.date}
          </p>
          <h2 className="mt-2 text-2xl font-medium tracking-tight">{post.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{post.body}</p>
        </SiteRevealItem>
      ))}
    </SiteRevealGroup>
  );
}

export function AnimatedGuideGroups({
  groups,
}: {
  groups: {
    title: string;
    guides: { href: string; title: string; description: string }[];
  }[];
}) {
  return (
    <>
      {groups.map((group) => (
        <SiteReveal key={group.title} className="mt-10 first:mt-0">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {group.title}
          </h2>
          <SiteRevealGroup className="mt-4 grid border-t border-border md:grid-cols-2">
            {group.guides.map((guide) => (
              <SiteRevealItem
                key={guide.href}
                className="border-b border-border md:border-r md:odd:pr-6 md:even:pl-6 md:[&:nth-child(2n)]:border-r-0"
              >
                <Link href={guide.href} className="block py-5">
                  <h3 className="text-lg font-medium">{guide.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{guide.description}</p>
                </Link>
              </SiteRevealItem>
            ))}
          </SiteRevealGroup>
        </SiteReveal>
      ))}
    </>
  );
}

export function AnimatedDetailGrid({
  items,
}: {
  items: { title: string; body: string }[];
}) {
  return (
    <SiteRevealGroup className="mt-10 grid gap-8 border-t border-border pt-10 lg:grid-cols-2">
      {items.map((item) => (
        <SiteRevealItem key={item.title}>
          <h3 className="text-base font-medium">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
        </SiteRevealItem>
      ))}
    </SiteRevealGroup>
  );
}

export function AnimatedModuleList({
  items,
}: {
  items: { name: string; body: string }[];
}) {
  return (
    <SiteRevealGroup className="mt-6 border-t border-border">
      {items.map((item) => (
        <SiteRevealItem
          key={item.name}
          className="grid gap-1 border-b border-border py-4 sm:grid-cols-[11rem_1fr] sm:gap-6"
        >
          <h3 className="text-sm font-medium">{item.name}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
        </SiteRevealItem>
      ))}
    </SiteRevealGroup>
  );
}

export function ContactChannels({ className }: { className?: string }) {
  return (
    <SiteRevealGroup className={cn("flex flex-col divide-y divide-border border-y border-border", className)}>
      <SiteRevealItem className="px-6 py-6">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          WhatsApp or phone
        </p>
        <p className="mt-2 text-lg font-medium">{whatsappNumber}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium">
          <a
            href={whatsappHref}
            className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon className="size-5" />
            WhatsApp
          </a>
          <a href={phoneHref} className="inline-flex items-center gap-2 underline-offset-4 hover:underline">
            <Phone className="size-5 shrink-0" aria-hidden />
            Call
          </a>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Same number for a message or a call. Useful when you would rather not create an account first.
        </p>
      </SiteRevealItem>
      <SiteRevealItem className="px-6 py-6">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Email</p>
        <a
          href={`mailto:${emailAddress}`}
          className="mt-2 inline-flex items-center gap-2 text-lg font-medium underline-offset-4 hover:underline"
        >
          <Mail className="size-5 shrink-0" aria-hidden />
          {emailAddress}
        </a>
        <p className="mt-2 text-sm text-muted-foreground">
          Setup help, a bug, or a request from the floor. A reply usually goes out within a business day.
        </p>
      </SiteRevealItem>
      <SiteRevealItem className="px-6 py-6">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Company</p>
        <a
          href="https://www.contrivya.com"
          className="mt-2 inline-flex items-center gap-2 text-lg font-medium underline-offset-4 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Building2 className="size-5 shrink-0 text-primary" aria-hidden />
          Contrivya
        </a>
        <p className="mt-2 text-sm text-muted-foreground">
          Plans start at ₹2,999 a month. The company site is www.contrivya.com.
        </p>
      </SiteRevealItem>
    </SiteRevealGroup>
  );
}

const aboutPillars = [
  {
    title: "Any staff device",
    body: "Phone, tablet, kiosk, or till. The books stay on the restaurant host. Connectors wait until Settings stores that host.",
    icon: Smartphone,
  },
  {
    title: "Ask is read only",
    body: "Staff ask about sales, tickets, and stock. The floor still rings the bill. Rules can notify after close.",
    icon: MessageCircle,
  },
  {
    title: "Built by Contrivya",
    body: "No call centre. WhatsApp, phone, or email reaches the people who build OrderlyPOS.",
    icon: Building2,
  },
];

export function AboutPillars() {
  return (
    <SiteRevealGroup className="mx-auto grid max-w-6xl lg:grid-cols-3">
      {aboutPillars.map((item) => {
        const Icon = item.icon;
        return (
          <SiteRevealItem
            key={item.title}
            className="border-b border-border px-5 py-10 sm:px-6 lg:border-r lg:border-b-0 lg:last:border-r-0"
          >
            <Icon className="size-5 text-primary" aria-hidden />
            <h2 className="mt-4 text-lg font-medium">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </SiteRevealItem>
        );
      })}
    </SiteRevealGroup>
  );
}

export function AboutReach() {
  return (
    <SiteReveal className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-2">
      <div>
        <h2 className="text-2xl font-medium tracking-tight">Reach Contrivya</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Yearly billing is 20% less. The full list is on the pricing page. The company site is
          www.contrivya.com.
        </p>
      </div>
      <ContactChannels />
    </SiteReveal>
  );
}
