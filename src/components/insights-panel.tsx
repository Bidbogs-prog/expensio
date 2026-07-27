"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Info,
  Lightbulb,
  OctagonAlert,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScopedTransactions, useCurrency, useSavingsContributions } from "@/lib/queries";
import { useCurrentMonth } from "@/hooks/use-derived";
import { generateInsights, type Insight, type InsightTone } from "@/lib/insights";
import { cn } from "@/lib/utils";

const TONE: Record<
  InsightTone,
  { icon: typeof Info; text: string; bg: string; ring: string }
> = {
  danger: {
    icon: OctagonAlert,
    text: "text-rose-400",
    bg: "bg-rose-500/12",
    ring: "ring-rose-500/20",
  },
  warning: {
    icon: AlertTriangle,
    text: "text-amber-400",
    bg: "bg-amber-500/12",
    ring: "ring-amber-500/20",
  },
  recommendation: {
    icon: Lightbulb,
    text: "text-primary",
    bg: "bg-primary/12",
    ring: "ring-primary/20",
  },
  positive: {
    icon: CheckCircle2,
    text: "text-emerald-400",
    bg: "bg-emerald-500/12",
    ring: "ring-emerald-500/20",
  },
  info: {
    icon: Info,
    text: "text-cyan-400",
    bg: "bg-cyan-500/12",
    ring: "ring-cyan-500/20",
  },
};

function InsightRow({ insight, index }: { insight: Insight; index: number }) {
  const t = TONE[insight.tone];
  const Icon = t.icon;
  return (
    <div
      className="reveal flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3.5 transition-smooth hover:border-border hover:bg-secondary/50"
      style={{ "--d": `${index * 70}ms` } as React.CSSProperties}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1", t.bg, t.ring)}>
        <Icon className={cn("h-[1.05rem] w-[1.05rem]", t.text)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug">{insight.title}</p>
          {insight.metric && (
            <span
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold tabular",
                t.bg,
                t.text
              )}
            >
              {insight.metric}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{insight.detail}</p>
      </div>
    </div>
  );
}

export function InsightsPanel({
  variant = "full",
  className,
  groupId = null,
}: {
  variant?: "full" | "compact";
  className?: string;
  groupId?: string | null;
}) {
  const { data: expenses } = useScopedTransactions("expense", groupId);
  const { data: income } = useScopedTransactions("income", groupId);
  const { data: contributions } = useSavingsContributions(groupId);
  const currency = useCurrency();
  const currentMonth = useCurrentMonth();

  const insights = useMemo(
    () =>
      generateInsights(expenses ?? [], income ?? [], currentMonth, currency, contributions ?? []),
    [expenses, income, currentMonth, currency, contributions]
  );

  const shown = variant === "compact" ? insights.slice(0, 3) : insights;

  return (
    <Card className={cn("relative overflow-hidden p-5 shadow-soft", className)}>
      {/* ambient accent */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
            <Sparkles className="h-[1.05rem] w-[1.05rem]" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold leading-none tracking-tight">
              Expensio AI
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Live analysis
            </p>
          </div>
        </div>
        {variant === "compact" && (
          <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
            <a href="/insights">
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>

      <div className="relative space-y-2.5">
        {shown.map((insight, i) => (
          <InsightRow key={insight.id} insight={insight} index={i} />
        ))}

        {shown.length === 0 && (
          <p className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-6 text-center text-sm text-muted-foreground">
            Add a few transactions and Expensio AI will start surfacing insights.
          </p>
        )}
      </div>
    </Card>
  );
}
