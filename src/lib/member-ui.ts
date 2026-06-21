// src/lib/member-ui.ts — consistent identity/colour for group members.
import type { Profile } from "@/types";

// Vivid, dark-surface-friendly palette (distinct from the category palettes).
const MEMBER_PALETTE = [
  "#a3e635", // lime
  "#22d3ee", // cyan
  "#f472b6", // pink
  "#fbbf24", // amber
  "#34d399", // emerald
  "#c084fc", // violet
  "#fb7185", // rose
  "#38bdf8", // sky
];

/** Deterministic colour per member id, stable across renders. */
export function memberColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return MEMBER_PALETTE[hash % MEMBER_PALETTE.length];
}

export function memberLabel(profile: Profile | null, fallback = "Member"): string {
  return profile?.full_name?.trim() || profile?.email?.trim() || fallback;
}

export function initialOf(label: string): string {
  return label.trim().charAt(0).toUpperCase() || "?";
}
