import { LifeBuoy } from "lucide-react";
import { Logo } from "./logo";

export function BrandFooter() {
  return (
    <div className="flex flex-col gap-2 border-t border-sidebar-border px-4 py-3">
      <a
        href="/contact"
        className="flex items-center justify-center gap-1.5 rounded-lg border border-sidebar-border px-3 py-1.5 text-xs font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LifeBuoy className="h-3.5 w-3.5" />
        Contact support
      </a>
      <a
        href="/orderlyPOS"
        className="inline-flex opacity-80 hover:opacity-100"
      >
        <Logo size={18} />
      </a>
    </div>
  );
}
