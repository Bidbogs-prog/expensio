"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedShinyText — a soft highlight sweeping across text. On-brand lime→white
// →lime gradient clipped to the glyphs. Falls back to solid primary under
// prefers-reduced-motion (see [data-shiny] rule in globals.css).
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from "@/lib/utils";

export function AnimatedShinyText({
  children,
  className,
  duration = 4,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}) {
  return (
    <span
      data-shiny
      className={cn("bg-clip-text text-transparent", className)}
      style={{
        backgroundImage:
          "linear-gradient(110deg, hsl(var(--primary) / 0.65) 35%, hsl(var(--foreground)) 50%, hsl(var(--primary) / 0.65) 65%)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        animation: `shiny-sweep ${duration}s linear infinite`,
      }}
    >
      {children}
    </span>
  );
}
