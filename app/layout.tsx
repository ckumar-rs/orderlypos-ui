import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "OrderlyPOS is an Agentic Restaurant POS for a cafe, a dining room, a kiosk, or a group of branches. The floor runs service. The same books are checked every five minutes after close.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:1995"),
  title: { default: "OrderlyPOS | Agentic restaurant POS", template: "%s | OrderlyPOS" },
  description: siteDescription,
  openGraph: {
    siteName: "OrderlyPOS",
    type: "website",
    title: "OrderlyPOS",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "OrderlyPOS",
    description: siteDescription,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#F2651B",
  // Lets the bottom nav / sheets sit inside the notch + home-indicator safe areas.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
