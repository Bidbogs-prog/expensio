"use client";

import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Tailwind classes for the colored value text. */
  valueClass?: string;
  /** Tailwind classes for the icon chip. */
  chipClass?: string;
  badge?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  valueClass,
  chipClass,
  badge,
}: StatCardProps) {
  return (
    <Card className="hover-lift shadow-soft p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            chipClass ?? "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-[1.1rem] w-[1.1rem]" />
        </div>
      </div>
      <p
        className={cn(
          "mt-3 text-2xl font-bold tracking-tight sm:text-3xl",
          valueClass
        )}
      >
        {value}
      </p>
      {badge && <div className="mt-2">{badge}</div>}
    </Card>
  );
}
