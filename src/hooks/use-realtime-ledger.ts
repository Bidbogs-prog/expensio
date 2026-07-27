// src/hooks/use-realtime-ledger.ts
// Subscribes to Supabase Realtime changes on expenses/income/savings and
// refreshes the shared family caches when a (visible) co-member's row changes.
// Realtime applies RLS per subscriber, so we only receive events for rows we're
// allowed to read.
"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useRealtimeLedger(enabled: boolean) {
  const qc = useQueryClient();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Coalesce bursts of changes (e.g. a member adding several rows) into one refetch.
    const invalidateSoon = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["group-tx"] });
        qc.invalidateQueries({ queryKey: ["group-savings"] });
      }, 300);
    };

    const channel = supabase
      .channel("household-ledger")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, invalidateSoon)
      .on("postgres_changes", { event: "*", schema: "public", table: "income" }, invalidateSoon)
      .on("postgres_changes", { event: "*", schema: "public", table: "savings_goals" }, invalidateSoon)
      .on("postgres_changes", { event: "*", schema: "public", table: "savings_contributions" }, invalidateSoon)
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [enabled, qc]);
}
