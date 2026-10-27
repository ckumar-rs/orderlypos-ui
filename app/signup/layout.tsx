import type { Metadata } from "next";
import { publicMeta } from "@/lib/seo";

export const metadata: Metadata = publicMeta(
  "/signup",
  "Create a restaurant account",
  "Create an OrderlyPOS account for one restaurant. Creating an account does not charge a card. A paid plan starts at ₹499 a month when Contrivya confirms it by email.",
);

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
