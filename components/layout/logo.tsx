import Image from "next/image";
import { cn } from "@/lib/utils";

// The lockup is wider than it is tall (terminal mark + ORDERLYPOS).
const RATIO = 2694 / 732;

export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="OrderlyPOS"
      width={Math.round(size * RATIO)}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      style={{ height: size, width: "auto" }}
      priority
    />
  );
}
