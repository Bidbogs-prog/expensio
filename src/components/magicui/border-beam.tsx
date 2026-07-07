"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BorderBeam — a comet of light that travels around a card's border.
// Pure CSS: a masked conic gradient rotated via an @property angle. Drop it
// inside any `relative` + `rounded-*` container. No runtime deps.
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from "@/lib/utils";

export function BorderBeam({
  className,
  duration = 7,
  delay = 0,
  /** Thickness of the beam ring, in px. */
  width = 1.5,
  /** Tailwind/CSS color for the beam head (defaults to the lime accent). */
  color = "hsl(var(--primary))",
}: {
  className?: string;
  duration?: number;
  delay?: number;
  width?: number;
  color?: string;
}) {
  return (
    <span
      aria-hidden
      data-beam
      className={cn("pointer-events-none absolute inset-0 rounded-[inherit]", className)}
      style={{
        padding: width,
        background: `conic-gradient(from var(--beam-angle), transparent 0deg, transparent 265deg, ${color} 320deg, #fff 342deg, ${color} 350deg, transparent 360deg)`,
        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        maskComposite: "exclude",
        WebkitMask:
          "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        animation: `beam-rotate ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}
