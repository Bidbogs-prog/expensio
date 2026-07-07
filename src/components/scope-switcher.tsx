"use client";

import { User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Group } from "@/types";

/**
 * Segmented control that picks the budget scope for adding/viewing transactions:
 * "Personal" (groupId = null) or one of the user's family groups.
 */
export function ScopeSwitcher({
  groups,
  value,
  onChange,
}: {
  groups: Group[];
  value: string | null;
  onChange: (groupId: string | null) => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card/60 p-1">
      <ScopeButton
        active={value === null}
        onClick={() => onChange(null)}
        icon={<User className="h-3.5 w-3.5" />}
        label="Personal"
      />
      {groups.map((g) => (
        <ScopeButton
          key={g.id}
          active={value === g.id}
          onClick={() => onChange(g.id)}
          icon={<Users className="h-3.5 w-3.5" />}
          label={g.name}
        />
      ))}
    </div>
  );
}

function ScopeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-smooth",
        active
          ? "bg-primary text-primary-foreground shadow-soft"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      {icon}
      <span className="max-w-[10rem] truncate">{label}</span>
    </button>
  );
}
