"use client";

import { useEffect } from "react";
import { Check, Sparkles, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TIERS } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface UpgradeDialogProps {
  open: boolean;
  feature?: string;
  onClose: () => void;
  onUpgrade: () => void;
}

export function UpgradeDialog({ open, feature, onClose, onUpgrade }: UpgradeDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* overlay */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-medium reveal">
        {/* glow header */}
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/10 to-transparent px-6 py-6">
          <div className="aurora-blob -right-10 -top-16 h-40 w-40 bg-primary/30 animate-aurora" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              Expensio Pro
            </span>
          </div>
          <h2 className="relative mt-2 font-display text-2xl font-bold tracking-tight">
            {feature ? `Unlock ${feature}` : "Upgrade to Pro"}
          </h2>
          <p className="relative mt-1 text-sm text-muted-foreground">
            Turn your tracker into a full financial co-pilot.
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="mb-4 flex items-baseline gap-1.5">
            <span className="font-display text-4xl font-bold tabular tracking-tight">$4</span>
            <span className="text-sm text-muted-foreground">/ month</span>
            <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              14-day free trial
            </span>
          </div>

          <ul className="grid gap-2.5">
            {TIERS[1].features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-foreground/90">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-2">
            <Button onClick={onUpgrade} className={cn("h-11 w-full text-sm font-semibold glow-primary")}>
              <Zap className="h-4 w-4" />
              Start free trial
            </Button>
            <button
              onClick={onClose}
              className="w-full py-2 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Maybe later
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
            Demo billing — upgrades instantly, no card required.
          </p>
        </div>
      </div>
    </div>
  );
}
