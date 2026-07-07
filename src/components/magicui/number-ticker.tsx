"use client";

// ─────────────────────────────────────────────────────────────────────────────
// NumberTicker — count-up animation (requestAnimationFrame, no deps).
// Animates from the previous value to the next, so month/currency changes glide
// instead of snapping. Respects prefers-reduced-motion.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function NumberTicker({
  value,
  decimals = 0,
  duration = 1100,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = value;
    if (from === value) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      setDisplay(from + (value - from) * easeOutCubic(p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const formatted = display.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return <span className={cn("tabular", className)}>{formatted}</span>;
}
