import { cn } from "@/lib/utils";

/** Expensio mark — three ascending ledger bars inside a rounded lime token. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={cn("h-8 w-8", className)}
      fill="none"
      aria-hidden="true"
    >
      <rect width="96" height="96" rx="27" fill="hsl(var(--primary))" />
      <rect x="18" y="51" width="12" height="24" rx="4.5" fill="hsl(var(--primary-foreground))" opacity="0.5" />
      <rect x="39" y="36" width="12" height="39" rx="4.5" fill="hsl(var(--primary-foreground))" opacity="0.78" />
      <rect x="60" y="21" width="12" height="54" rx="4.5" fill="hsl(var(--primary-foreground))" />
    </svg>
  );
}

/** "Expensio" wordmark with the "io" set in the lime accent. */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-bold tracking-tight", className)}>
      Expens<span className="text-primary">io</span>
    </span>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="h-8 w-8" />
      <BrandWordmark className="text-lg" />
    </div>
  );
}
