import { cn } from "@/lib/utils";

/** Expensio mark — a stylised ascending ledger bar inside a rounded token. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-8 w-8", className)}
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" fill="hsl(var(--primary))" />
      <rect x="6" y="17" width="4" height="8" rx="1.5" fill="hsl(var(--primary-foreground))" opacity="0.55" />
      <rect x="13" y="12" width="4" height="13" rx="1.5" fill="hsl(var(--primary-foreground))" opacity="0.8" />
      <rect x="20" y="7" width="4" height="18" rx="1.5" fill="hsl(var(--primary-foreground))" />
    </svg>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="h-8 w-8" />
      <span className="font-display text-lg font-bold tracking-tight">
        Expensio
      </span>
    </div>
  );
}
