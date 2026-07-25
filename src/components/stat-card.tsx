"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import { cn } from "@/lib/utils";

type Tone = "accent" | "positive" | "negative" | "neutral" | "sky";

const TONE: Record<Tone, { chip: string; value: string; glow?: string; beam: string }> = {
  accent: {
    chip: "bg-primary/15 text-primary ring-primary/20",
    value: "text-foreground",
    glow: "before:bg-primary/10",
    beam: "hsl(var(--primary))",
  },
  positive: {
    chip: "bg-emerald-500/12 text-emerald-400 ring-emerald-500/20",
    value: "text-emerald-400",
    beam: "#34d399", // emerald-400
  },
  negative: {
    chip: "bg-rose-500/12 text-rose-400 ring-rose-500/20",
    value: "text-rose-400",
    beam: "#fb7185", // rose-400
  },
  neutral: {
    chip: "bg-secondary text-muted-foreground ring-border",
    value: "text-foreground",
    beam: "hsl(var(--primary))",
  },
  // Savings identity — money set aside, neither income nor spending.
  sky: {
    chip: "bg-sky-500/12 text-sky-400 ring-sky-500/20",
    value: "text-sky-400",
    glow: "before:bg-sky-500/10",
    beam: "#38bdf8", // sky-400
  },
};

interface StatCardProps {
  label: string;
  /** A number renders with a count-up animation; a string renders as-is (e.g. "—"). */
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  tone?: Tone;
  delta?: { label: string; positive: boolean } | null;
  hint?: React.ReactNode;
  featured?: boolean;
  /** Render an animated border beam (reserve for the single focal card). */
  beam?: boolean;
}

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "neutral",
  delta,
  hint,
  featured,
  beam,
}: StatCardProps) {
  const t = TONE[tone];
  return (
    <Card
      className={cn(
        "hover-lift relative overflow-hidden p-5 shadow-soft",
        featured && "before:absolute before:-right-12 before:-top-16 before:h-40 before:w-40 before:rounded-full before:blur-3xl",
        featured && t.glow
      )}
    >
      {beam && <BorderBeam duration={8} color={t.beam} />}
      <div className="relative flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg ring-1", t.chip)}>
          <Icon className="h-[1.05rem] w-[1.05rem]" />
        </div>
      </div>

      <p className={cn("relative mt-4 font-display text-3xl font-extrabold tracking-tight tabular sm:text-[2rem]", t.value)}>
        {typeof value === "number" ? <NumberTicker value={value} /> : value}
        {unit && <span className="ml-1.5 text-base font-semibold text-muted-foreground">{unit}</span>}
      </p>

      {(delta || hint) && (
        <div className="relative mt-2 flex items-center gap-2">
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
                delta.positive
                  ? "bg-emerald-500/12 text-emerald-400"
                  : "bg-rose-500/12 text-rose-400"
              )}
            >
              {delta.positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {delta.label}
            </span>
          )}
          {hint}
        </div>
      )}
    </Card>
  );
}
